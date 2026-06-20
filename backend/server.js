import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Initialize services
let supabase, provider, signer, contract;

// Initialize all services
async function initializeServices() {
  try {
    // Initialize Supabase
    supabase = createClient(
      process.env.SUPABASE_URL || 'your-supabase-url',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-supabase-service-role-key'
    );

    // Initialize Ethereum provider (Hardhat local network)
    provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    
    // Get signer (first account from Hardhat)
    signer = await provider.getSigner();

    // Contract ABI and address (will be set after deployment)
    const contractABI = [
      "function storeCertificate(bytes32 _certificateHash, string _studentName, string _studentId, string _degree, string _ipfsHash) public",
      "function verifyCertificate(bytes32 _certificateHash) public view returns (tuple(string,string,string,string,string,address,uint256,bool))",
      "function authorizeIssuer(address _issuer, string _university) public",
      "function getCertificateDetails(bytes32 _certificateHash) public view returns (string,string,string,string,string,address,uint256,bool)",
      "function isCertificateValid(bytes32 _certificateHash) public view returns (bool)"
    ];
    
    // This address will be updated after contract deployment
    const contractAddress = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    console.log('All services initialized successfully');
  } catch (err) {
    console.error('Error initializing services:', err);
  }
}

// Digital signature functions
function generateKeyPair() {
  const keyPair = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  return keyPair;
}

function signCertificateData(data, privateKey) {
  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(data));
  sign.end();
  return sign.sign(privateKey, 'hex');
}

function verifyCertificateSignature(data, signature, publicKey) {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(JSON.stringify(data));
    verify.end();
    return verify.verify(publicKey, signature, 'hex');
  } catch {
    return false;
  }
}

// Helper function to create certificate hash
function createCertificateHash(certificateData) {
  const dataString = JSON.stringify({
    studentName: certificateData.studentName,
    studentEmail: certificateData.studentEmail, // Use email as unique identifier
    courseName: certificateData.courseName,
    courseCode: certificateData.courseCode,
    completionDate: certificateData.completionDate,
    grade: certificateData.grade,
    degreeType: certificateData.degreeType,
    university: certificateData.university,
    timestamp: Date.now() // Add timestamp to ensure uniqueness
  });
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// Upload file to IPFS using web3.storage
async function uploadToIPFS(file) {
  try {
    // For development - you can enable real IPFS upload by setting this to true
    const USE_REAL_IPFS = false;
    
    if (USE_REAL_IPFS) {
      // Real IPFS upload using web3.storage (requires W3UP_TOKEN)
      const { create } = await import('@web3-storage/w3up-client');
      const client = await create();
      
      // Convert file buffer to File object
      const fileObject = new File([file.buffer], file.originalname, {
        type: file.mimetype
      });
      
      // Upload to IPFS
      const cid = await client.uploadFile(fileObject);
      const ipfsUrl = `https://w3s.link/ipfs/${cid}`;
      
      console.log(`Real IPFS upload: ${file.originalname} -> ${cid}`);
      return ipfsUrl;
    } else {
      // Mock IPFS for development
      const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
      const mockIPFSHash = `Qm${hash.substring(0, 44)}`;
      const ipfsUrl = `https://ipfs.io/ipfs/${mockIPFSHash}`;
      
      console.log(`Mock IPFS upload: ${file.originalname} -> ${mockIPFSHash}`);
      console.log(`⚠️  WARNING: This is a MOCK upload. PDF is NOT actually stored on IPFS.`);
      console.log(`   To enable real IPFS upload, set USE_REAL_IPFS = true in uploadToIPFS function`);
      
      return ipfsUrl;
    }
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error('Failed to upload to IPFS');
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Certificate verification API is running',
    timestamp: new Date().toISOString()
  });
});

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // For development, use simple authentication
    // In production, you'd want proper password hashing
    if (email === 'admin@university.edu' && password === 'admin123') {
      // Check if admin exists in database
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        return res.status(401).json({ error: 'Admin user not found' });
      }

      res.json({
        success: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          university: adminUser.university,
          role: adminUser.role
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Issue certificate endpoint
app.post('/api/certificates/issue', upload.single('certificate'), async (req, res) => {
  try {
    const { studentName, studentEmail, courseName, courseCode, completionDate, grade, degreeType, university } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Certificate PDF file is required' });
    }

    // Validate required fields
    if (!studentName || !studentEmail || !courseName || !courseCode || !completionDate || !grade || !university) {
      return res.status(400).json({ error: 'All certificate fields are required' });
    }

    // Create certificate data object
    const certificateData = {
      studentName,
      studentEmail,
      courseName,
      courseCode,
      completionDate,
      grade,
      degreeType: degreeType || 'Certificate',
      university: university
    };

    // Generate certificate hash
    const certificateHash = createCertificateHash(certificateData);

    // Generate digital signature
    const keyPair = generateKeyPair();
    const signature = signCertificateData(certificateData, keyPair.privateKey);

    // Upload PDF to IPFS
    const ipfsUrl = await uploadToIPFS(file);
    const ipfsHash = ipfsUrl.split('/')[2].split('.')[0]; // Extract CID

    // Store in Supabase database
    const { error: dbError } = await supabase
      .from('certificates')
      .insert([
        {
          certificate_hash: certificateHash,
          student_name: studentName,
          student_id: studentEmail, // Use email as student ID for now
          student_email: studentEmail,
          course_name: courseName,
          course_code: courseCode,
          completion_date: completionDate,
          grade: grade,
          degree_type: degreeType,
          university: university,
          degree: `${courseName} - ${degreeType}`, // Combine course and degree type
          issue_date: new Date().toISOString(),
          ipfs_url: ipfsUrl,
          ipfs_hash: ipfsHash,
          digital_signature: signature,
          public_key: keyPair.publicKey,
          issuer_address: await signer.getAddress(),
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Store on blockchain
    try {
      const certificateHashBytes = ethers.keccak256(ethers.toUtf8Bytes(certificateHash));
      const tx = await contract.storeCertificate(
        certificateHashBytes,
        studentName,
        studentEmail, // Use studentEmail instead of studentId
        `${courseName} - ${degreeType}`, // Combine course and degree type
        ipfsHash
      );
      
      await tx.wait();
      console.log('Certificate stored on blockchain:', tx.hash);
    } catch (blockchainError) {
      console.error('Blockchain storage error:', blockchainError);
      // Continue without blockchain for now
    }

    res.json({
      success: true,
      certificateHash,
      ipfsUrl,
      signature,
      message: 'Certificate issued successfully'
    });

  } catch (error) {
    console.error('Certificate issuance error:', error);
    res.status(500).json({ error: error.message || 'Failed to issue certificate' });
  }
});

// Verify certificate endpoint
app.get('/api/certificates/verify/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    // Query database first
    const { data: dbData, error: dbError } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_hash', hash)
      .single();

    if (dbError || !dbData) {
      return res.status(404).json({ 
        error: 'Certificate not found',
        isValid: false 
      });
    }

    // Verify digital signature
    const certificateData = {
      studentName: dbData.student_name,
      studentEmail: dbData.student_email,
      courseName: dbData.course_name,
      courseCode: dbData.course_code,
      completionDate: dbData.completion_date,
      grade: dbData.grade,
      degreeType: dbData.degree_type,
      university: dbData.university
    };

    const isSignatureValid = verifyCertificateSignature(
      certificateData,
      dbData.digital_signature,
      dbData.public_key
    );

    // Check blockchain verification (if available)
    let blockchainValid = false;
    try {
      const certificateHashBytes = ethers.keccak256(ethers.toUtf8Bytes(hash));
      blockchainValid = await contract.isCertificateValid(certificateHashBytes);
    } catch (error) {
      console.log('Blockchain verification not available:', error.message);
    }

    res.json({
      isValid: isSignatureValid,
      blockchainVerified: blockchainValid,
      certificate: {
        studentName: dbData.student_name,
        studentEmail: dbData.student_email,
        courseName: dbData.course_name,
        courseCode: dbData.course_code,
        completionDate: dbData.completion_date,
        grade: dbData.grade,
        degreeType: dbData.degree_type,
        university: dbData.university,
        issueDate: dbData.issue_date,
        ipfsUrl: dbData.ipfs_url,
        issuerAddress: dbData.issuer_address,
        timestamp: dbData.created_at
      },
      signatureValid: isSignatureValid
    });

  } catch (error) {
    console.error('Certificate verification error:', error);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
});

// Get all certificates (admin only)
app.get('/api/certificates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Authorize issuer endpoint
app.post('/api/admin/authorize-issuer', async (req, res) => {
  try {
    const { issuerAddress, university } = req.body;

    if (!issuerAddress || !university) {
      return res.status(400).json({ error: 'Issuer address and university are required' });
    }

    // Store in blockchain
    const tx = await contract.authorizeIssuer(issuerAddress, university);
    await tx.wait();

    // Store in database
    const { error } = await supabase
      .from('authorized_issuers')
      .insert([
        {
          issuer_address: issuerAddress,
          university: university,
          authorized_at: new Date().toISOString()
        }
      ]);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Issuer authorized successfully',
      txHash: tx.hash
    });

  } catch (error) {
    console.error('Error authorizing issuer:', error);
    res.status(500).json({ error: 'Failed to authorize issuer' });
  }
});

// Error handling middleware
app.use((error, req, res) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed.' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    console.log(`Certificate verification API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(console.error);

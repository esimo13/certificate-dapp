import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { calculateTransferredUnits, roundUnits } from './utils/creditTransfer.js';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const PdfParseCtor =
  pdfParseModule?.PDFParse ||
  pdfParseModule?.default?.PDFParse ||
  null;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const adminSessions = new Map();

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
    provider = new ethers.JsonRpcProvider('process.env.RPC_URL');
    
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

async function extractTextFromPdfBuffer(buffer) {
  let rawText = '';

  // pdf-parse v1 exports a function; v2 exports a PDFParse class.
  if (typeof pdfParseModule === 'function') {
    const parsed = await pdfParseModule(buffer);
    rawText = String(parsed?.text || '');
  } else if (PdfParseCtor) {
    const parser = new PdfParseCtor({ data: buffer });
    try {
      const parsed = await parser.getText();
      rawText = String(parsed?.text || '');
    } finally {
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
    }
  } else {
    throw new Error('Unsupported pdf-parse module format');
  }

  const text = rawText.replace(/\u0000/g, '').trim();

  if (!text) {
    throw new Error('Uploaded PDF does not contain extractable text');
  }

  // Keep payload size bounded before sending to edge function.
  return text.slice(0, 20000);
}

async function compareSyllabusWithEdgeFunction(syllabusA, syllabusB) {
  const functionsBaseUrl = process.env.SUPABASE_FUNCTIONS_URL ||
    (process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL}/functions/v1` : null);

  if (!functionsBaseUrl) {
    return {
      ok: false,
      status: 500,
      data: { error: 'Supabase Functions URL is not configured' },
    };
  }

  const response = await fetch(`${functionsBaseUrl}/syllabus-comparison`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`,
    },
    body: JSON.stringify({ syllabusA, syllabusB }),
  });

  const data = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function getOrCreateUniversityByName(universityName) {
  const normalized = String(universityName || '').trim();
  if (!normalized) {
    throw new Error('University name is required');
  }

  const { data: existingUni, error: existingError } = await supabase
    .from('universities')
    .select('id, name, country, annual_load_units')
    .eq('name', normalized)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingUni) {
    return existingUni;
  }

  const { data: insertedUni, error: insertError } = await supabase
    .from('universities')
    .insert([
      {
        name: normalized,
        country: 'Unknown',
        annual_load_units: 24,
      },
    ])
    .select('id, name, country, annual_load_units')
    .single();

  if (insertError) {
    throw insertError;
  }

  return insertedUni;
}

async function resolveAdminSession(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return res.status(401).json({ error: 'Missing admin session token' });
    }

    const session = adminSessions.get(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired admin session token' });
    }

    const university = await getOrCreateUniversityByName(session.university);

    req.adminSession = {
      ...session,
      university,
      token,
    };

    next();
  } catch (error) {
    console.error('Admin session resolution error:', error);
    res.status(500).json({ error: 'Failed to resolve admin session' });
  }
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

// Transfer module endpoints
app.get('/api/transfer/universities', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('id, name, country, annual_load_units')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ universities: data || [] });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

app.get('/api/transfer/courses', async (req, res) => {
  try {
    const uniId = req.query.uniId;
    if (!uniId) {
      return res.status(400).json({ error: 'uniId query parameter is required' });
    }

    const { data, error } = await supabase
      .from('courses')
      .select('id, uni_id, course_code, title, credits, syllabus_text')
      .eq('uni_id', uniId)
      .order('course_code', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ courses: data || [] });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.post('/api/transfer/calculate', async (req, res) => {
  try {
    const { sourceUniversityId, targetUniversityId, sourceCourseIds, eligibilityProof } = req.body;

    if (!sourceUniversityId || !targetUniversityId) {
      return res.status(400).json({ error: 'sourceUniversityId and targetUniversityId are required' });
    }

    if (!Array.isArray(sourceCourseIds) || sourceCourseIds.length === 0) {
      return res.status(400).json({ error: 'sourceCourseIds must be a non-empty array' });
    }

    const [{ data: sourceUni, error: sourceUniError }, { data: targetUni, error: targetUniError }] = await Promise.all([
      supabase.from('universities').select('id, name, annual_load_units').eq('id', sourceUniversityId).single(),
      supabase.from('universities').select('id, name, annual_load_units').eq('id', targetUniversityId).single(),
    ]);

    if (sourceUniError || !sourceUni) {
      return res.status(404).json({ error: 'Source university not found' });
    }

    if (targetUniError || !targetUni) {
      return res.status(404).json({ error: 'Target university not found' });
    }

    const { data: sourceCourses, error: sourceCoursesError } = await supabase
      .from('courses')
      .select('id, uni_id, course_code, title, credits, syllabus_text')
      .in('id', sourceCourseIds)
      .eq('uni_id', sourceUniversityId);

    if (sourceCoursesError) {
      throw sourceCoursesError;
    }

    if (!sourceCourses || sourceCourses.length === 0) {
      return res.status(404).json({ error: 'No source courses found for the selected university' });
    }

    const sourceIds = sourceCourses.map((course) => course.id);
    const { data: equivalenciesData, error: eqError } = await supabase
      .from('equivalencies')
      .select('id, source_course_id, target_course_id, match_confidence_score')
      .in('source_course_id', sourceIds);

    if (eqError) {
      throw eqError;
    }

    const equivalencies = equivalenciesData || [];
    const targetCourseIds = [...new Set(equivalencies.map((item) => item.target_course_id))];

    let targetCoursesById = {};
    if (targetCourseIds.length > 0) {
      const { data: targetCoursesData, error: targetCoursesError } = await supabase
        .from('courses')
        .select('id, uni_id, course_code, title, credits, syllabus_text')
        .in('id', targetCourseIds)
        .eq('uni_id', targetUniversityId);

      if (targetCoursesError) {
        throw targetCoursesError;
      }

      targetCoursesById = (targetCoursesData || []).reduce((acc, course) => {
        acc[course.id] = course;
        return acc;
      }, {});
    }

    let estimatedTransferableUnits = 0;
    const mappedCourses = sourceCourses.map((sourceCourse) => {
      const convertedUnits = roundUnits(
        calculateTransferredUnits(
          sourceCourse.credits,
          sourceUni.annual_load_units,
          targetUni.annual_load_units
        )
      );

      estimatedTransferableUnits += convertedUnits;

      const matches = equivalencies
        .filter((eq) => eq.source_course_id === sourceCourse.id)
        .map((eq) => ({
          equivalencyId: eq.id,
          matchConfidenceScore: eq.match_confidence_score,
          targetCourse: targetCoursesById[eq.target_course_id] || null,
        }))
        .filter((item) => item.targetCourse)
        .sort((a, b) => b.matchConfidenceScore - a.matchConfidenceScore);

      return {
        sourceCourse,
        convertedUnits,
        bestMatch: matches[0] || null,
        suggestions: matches,
      };
    });

    res.json({
      sourceUniversity: sourceUni,
      targetUniversity: targetUni,
      estimatedTransferableUnits: roundUnits(estimatedTransferableUnits),
      mappedCourses,
      privacy: {
        eligibilityProofProvided: Boolean(eligibilityProof),
        note: eligibilityProof
          ? 'Zero-knowledge eligibility proof token received (verification adapter can be plugged in).'
          : 'No zero-knowledge proof token provided for this estimate.',
      },
    });
  } catch (error) {
    console.error('Error calculating transfer units:', error);
    res.status(500).json({ error: 'Failed to calculate transfer units' });
  }
});

app.post('/api/transfer/syllabus-compare', async (req, res) => {
  try {
    const { syllabusA, syllabusB } = req.body;

    if (!syllabusA || !syllabusB) {
      return res.status(400).json({ error: 'syllabusA and syllabusB are required' });
    }

    const result = await compareSyllabusWithEdgeFunction(syllabusA, syllabusB);

    if (!result.ok) {
      return res.status(result.status).json({
        error: result.data?.error || 'Syllabus comparison failed',
      });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error comparing syllabi:', error);
    res.status(500).json({ error: 'Failed to compare syllabi' });
  }
});

app.post(
  '/api/transfer/syllabus-compare-pdf',
  upload.fields([
    { name: 'sourceSyllabusPdf', maxCount: 1 },
    { name: 'targetSyllabusPdf', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files || {};
      const sourceFile = files.sourceSyllabusPdf?.[0];
      const targetFile = files.targetSyllabusPdf?.[0];

      if (!sourceFile || !targetFile) {
        return res.status(400).json({
          error: 'sourceSyllabusPdf and targetSyllabusPdf are required',
        });
      }

      const [syllabusA, syllabusB] = await Promise.all([
        extractTextFromPdfBuffer(sourceFile.buffer),
        extractTextFromPdfBuffer(targetFile.buffer),
      ]);

      const result = await compareSyllabusWithEdgeFunction(syllabusA, syllabusB);

      if (!result.ok) {
        return res.status(result.status).json({
          error: result.data?.error || 'Syllabus comparison failed',
        });
      }

      res.json({
        ...result.data,
        extraction: {
          sourceChars: syllabusA.length,
          targetChars: syllabusB.length,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to compare syllabus PDFs';
      console.error('Error comparing syllabus PDFs:', error);
      res.status(500).json({ error: message });
    }
  }
);

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !adminUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Temporary password strategy:
    // 1) if admin_users.password exists, validate against it
    // 2) fallback to ADMIN_DEFAULT_PASSWORD for bootstrap environments
    const storedPassword = adminUser.password || null;
    const bootstrapPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const isValidPassword = storedPassword
      ? password === storedPassword
      : password === bootstrapPassword;

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.set(token, {
      id: adminUser.id,
      email: adminUser.email,
      university: adminUser.university,
      role: adminUser.role,
      createdAt: Date.now(),
    });

    const university = await getOrCreateUniversityByName(adminUser.university);

    res.json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        university: adminUser.university,
        role: adminUser.role,
        universityRecord: university,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/logout', resolveAdminSession, async (req, res) => {
  adminSessions.delete(req.adminSession.token);
  res.json({ success: true });
});

app.get('/api/admin/university', resolveAdminSession, async (req, res) => {
  const { university, email, role } = req.adminSession;
  res.json({
    user: { email, role, university: university.name },
    university,
  });
});

app.put('/api/admin/university', resolveAdminSession, async (req, res) => {
  try {
    const { country, annualLoadUnits } = req.body;
    const { university } = req.adminSession;

    const payload = {};
    if (typeof country === 'string' && country.trim()) {
      payload.country = country.trim();
    }
    if (annualLoadUnits !== undefined) {
      const numericLoad = Number(annualLoadUnits);
      if (!Number.isFinite(numericLoad) || numericLoad <= 0) {
        return res.status(400).json({ error: 'annualLoadUnits must be greater than zero' });
      }
      payload.annual_load_units = numericLoad;
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No valid university fields provided' });
    }

    const { data, error } = await supabase
      .from('universities')
      .update(payload)
      .eq('id', university.id)
      .select('id, name, country, annual_load_units')
      .single();

    if (error) {
      throw error;
    }

    res.json({ success: true, university: data });
  } catch (error) {
    console.error('Error updating university profile:', error);
    res.status(500).json({ error: 'Failed to update university profile' });
  }
});

app.get('/api/admin/university/courses', resolveAdminSession, async (req, res) => {
  try {
    const { university } = req.adminSession;
    const { data, error } = await supabase
      .from('courses')
      .select('id, uni_id, course_code, title, credits, syllabus_text, created_at, updated_at')
      .eq('uni_id', university.id)
      .order('course_code', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ courses: data || [] });
  } catch (error) {
    console.error('Error fetching admin university courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.post('/api/admin/university/courses', resolveAdminSession, async (req, res) => {
  try {
    const { university } = req.adminSession;
    const { courseCode, title, credits, syllabusText } = req.body;

    const code = String(courseCode || '').trim().toUpperCase();
    const courseTitle = String(title || '').trim();
    const courseCredits = Number(credits);
    const courseSyllabus = String(syllabusText || '').trim();

    if (!code || !courseTitle || !Number.isFinite(courseCredits) || courseCredits <= 0) {
      return res.status(400).json({
        error: 'courseCode, title and positive credits are required',
      });
    }

    const { data, error } = await supabase
      .from('courses')
      .upsert(
        [
          {
            uni_id: university.id,
            course_code: code,
            title: courseTitle,
            credits: courseCredits,
            syllabus_text: courseSyllabus || null,
          },
        ],
        { onConflict: 'uni_id,course_code' }
      )
      .select('id, uni_id, course_code, title, credits, syllabus_text, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    res.json({ success: true, course: data });
  } catch (error) {
    console.error('Error creating/updating course:', error);
    res.status(500).json({ error: 'Failed to save course' });
  }
});

app.put('/api/admin/university/courses/:courseId', resolveAdminSession, async (req, res) => {
  try {
    const { university } = req.adminSession;
    const { courseId } = req.params;
    const { courseCode, title, credits, syllabusText } = req.body;

    const payload = {};
    if (courseCode !== undefined) {
      const normalized = String(courseCode || '').trim().toUpperCase();
      if (!normalized) {
        return res.status(400).json({ error: 'courseCode cannot be empty' });
      }
      payload.course_code = normalized;
    }

    if (title !== undefined) {
      const normalized = String(title || '').trim();
      if (!normalized) {
        return res.status(400).json({ error: 'title cannot be empty' });
      }
      payload.title = normalized;
    }

    if (credits !== undefined) {
      const numericCredits = Number(credits);
      if (!Number.isFinite(numericCredits) || numericCredits <= 0) {
        return res.status(400).json({ error: 'credits must be greater than zero' });
      }
      payload.credits = numericCredits;
    }

    if (syllabusText !== undefined) {
      payload.syllabus_text = String(syllabusText || '').trim() || null;
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No valid course fields provided' });
    }

    const { data, error } = await supabase
      .from('courses')
      .update(payload)
      .eq('id', courseId)
      .eq('uni_id', university.id)
      .select('id, uni_id, course_code, title, credits, syllabus_text, created_at, updated_at')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Course not found for this university' });
    }

    res.json({ success: true, course: data });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
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

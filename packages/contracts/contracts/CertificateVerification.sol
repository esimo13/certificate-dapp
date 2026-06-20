// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title CertificateVerification
 * @dev Smart contract for storing and verifying university certificates on blockchain
 * @author DApp Certificate Team
 */
contract CertificateVerification {
    struct Certificate {
        string studentName;
        string studentId;
        string degree;
        string university;
        string ipfsHash;
        address issuer;
        uint256 timestamp;
        bool isValid;
    }

    // Mapping from certificate hash to certificate data
    mapping(bytes32 => Certificate) public certificates;
    
    // Mapping to check if a certificate hash exists
    mapping(bytes32 => bool) public certificateExists;
    
    // Mapping from issuer address to university name
    mapping(address => string) public authorizedIssuers;
    
    // Events
    event CertificateStored(
        bytes32 indexed certificateHash,
        address indexed issuer,
        string studentName,
        string university,
        uint256 timestamp
    );
    
    event IssuerAuthorized(address indexed issuer, string university);
    event CertificateRevoked(bytes32 indexed certificateHash);

    // Modifiers
    modifier onlyAuthorizedIssuer() {
        require(bytes(authorizedIssuers[msg.sender]).length > 0, "Not an authorized issuer");
        _;
    }

    modifier certificateMustExist(bytes32 _certificateHash) {
        require(certificateExists[_certificateHash], "Certificate does not exist");
        _;
    }

    /**
     * @dev Authorize a university issuer
     * @param _issuer Address of the university issuer
     * @param _university Name of the university
     */
    function authorizeIssuer(address _issuer, string memory _university) public {
        // In a production environment, this should be restricted to admin only
        // For demo purposes, anyone can authorize an issuer
        authorizedIssuers[_issuer] = _university;
        emit IssuerAuthorized(_issuer, _university);
    }

    /**
     * @dev Store a certificate on the blockchain
     * @param _certificateHash SHA256 hash of the certificate data
     * @param _studentName Name of the student
     * @param _studentId Student ID
     * @param _degree Degree name
     * @param _ipfsHash IPFS hash of the certificate PDF
     */
    function storeCertificate(
        bytes32 _certificateHash,
        string memory _studentName,
        string memory _studentId,
        string memory _degree,
        string memory _ipfsHash
    ) public onlyAuthorizedIssuer {
        require(!certificateExists[_certificateHash], "Certificate already exists");
        require(bytes(_studentName).length > 0, "Student name cannot be empty");
        require(bytes(_studentId).length > 0, "Student ID cannot be empty");
        require(bytes(_degree).length > 0, "Degree cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");

        Certificate memory newCertificate = Certificate({
            studentName: _studentName,
            studentId: _studentId,
            degree: _degree,
            university: authorizedIssuers[msg.sender],
            ipfsHash: _ipfsHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            isValid: true
        });

        certificates[_certificateHash] = newCertificate;
        certificateExists[_certificateHash] = true;

        emit CertificateStored(
            _certificateHash,
            msg.sender,
            _studentName,
            authorizedIssuers[msg.sender],
            block.timestamp
        );
    }

    /**
     * @dev Verify a certificate by its hash
     * @param _certificateHash SHA256 hash of the certificate
     * @return Certificate data if valid
     */
    function verifyCertificate(bytes32 _certificateHash) 
        public 
        view 
        certificateMustExist(_certificateHash)
        returns (Certificate memory) 
    {
        return certificates[_certificateHash];
    }

    /**
     * @dev Check if a certificate is valid
     * @param _certificateHash SHA256 hash of the certificate
     * @return bool indicating if certificate is valid
     */
    function isCertificateValid(bytes32 _certificateHash) 
        public 
        view 
        returns (bool) 
    {
        if (!certificateExists[_certificateHash]) {
            return false;
        }
        return certificates[_certificateHash].isValid;
    }

    /**
     * @dev Revoke a certificate (only by issuer)
     * @param _certificateHash SHA256 hash of the certificate
     */
    function revokeCertificate(bytes32 _certificateHash) 
        public 
        certificateMustExist(_certificateHash) 
    {
        require(certificates[_certificateHash].issuer == msg.sender, "Only issuer can revoke");
        certificates[_certificateHash].isValid = false;
        emit CertificateRevoked(_certificateHash);
    }

    /**
     * @dev Get certificate details by hash
     * @param _certificateHash SHA256 hash of the certificate
     * @return studentName Name of the student
     * @return studentId ID of the student
     * @return degree Degree/course name
     * @return university University name
     * @return ipfsHash IPFS hash of the certificate PDF
     * @return issuer Address of the certificate issuer
     * @return timestamp When the certificate was issued
     * @return isValid Whether the certificate is valid
     */
    function getCertificateDetails(bytes32 _certificateHash) 
        public 
        view 
        certificateMustExist(_certificateHash)
        returns (
            string memory studentName,
            string memory studentId,
            string memory degree,
            string memory university,
            string memory ipfsHash,
            address issuer,
            uint256 timestamp,
            bool isValid
        ) 
    {
        Certificate memory cert = certificates[_certificateHash];
        return (
            cert.studentName,
            cert.studentId,
            cert.degree,
            cert.university,
            cert.ipfsHash,
            cert.issuer,
            cert.timestamp,
            cert.isValid
        );
    }

    /**
     * @dev Get university name by issuer address
     * @param _issuer Issuer address
     * @return University name
     */
    function getUniversityByIssuer(address _issuer) 
        public 
        view 
        returns (string memory) 
    {
        return authorizedIssuers[_issuer];
    }
}

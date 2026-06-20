import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CertificateVerificationModule = buildModule("CertificateVerificationModule", (m) => {
  const certificateVerification = m.contract("CertificateVerification");

  return { certificateVerification };
});

export default CertificateVerificationModule;

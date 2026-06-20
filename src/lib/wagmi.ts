import { createConfig, http } from 'wagmi'
import { hardhat, localhost } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [hardhat, localhost],
  connectors: [
    injected(),
  ],
  transports: {
    [hardhat.id]: http(),
    [localhost.id]: http(),
  },
})

// Smart contract configuration
export const CONTRACT_CONFIG = {
  address: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`,
  abi: [
    {
      "inputs": [
        {"name": "_certificateHash", "type": "bytes32"},
        {"name": "_studentName", "type": "string"},
        {"name": "_studentId", "type": "string"},
        {"name": "_degree", "type": "string"},
        {"name": "_ipfsHash", "type": "string"}
      ],
      "name": "storeCertificate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"name": "_certificateHash", "type": "bytes32"}],
      "name": "verifyCertificate",
      "outputs": [
        {
          "components": [
            {"name": "studentName", "type": "string"},
            {"name": "studentId", "type": "string"},
            {"name": "degree", "type": "string"},
            {"name": "university", "type": "string"},
            {"name": "ipfsHash", "type": "string"},
            {"name": "issuer", "type": "address"},
            {"name": "timestamp", "type": "uint256"},
            {"name": "isValid", "type": "bool"}
          ],
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"name": "_issuer", "type": "address"},
        {"name": "_university", "type": "string"}
      ],
      "name": "authorizeIssuer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"name": "_certificateHash", "type": "bytes32"}],
      "name": "isCertificateValid",
      "outputs": [{"name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"name": "_certificateHash", "type": "bytes32"}],
      "name": "getCertificateDetails",
      "outputs": [
        {"name": "studentName", "type": "string"},
        {"name": "studentId", "type": "string"},
        {"name": "degree", "type": "string"},
        {"name": "university", "type": "string"},
        {"name": "ipfsHash", "type": "string"},
        {"name": "issuer", "type": "address"},
        {"name": "timestamp", "type": "uint256"},
        {"name": "isValid", "type": "bool"}
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const
}

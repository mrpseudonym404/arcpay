import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";

const contractClient = initiateSmartContractPlatformClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

async function createMonitors() {
  try {
    const monitor1 = await contractClient.createEventMonitor({
      blockchain: "ARC-TESTNET",
      contractAddress: process.env.CONTRACT_ADDRESS,
      eventSignature: "RequestCreated(bytes32,address,string,uint256)",
    });
    console.log("✅ Monitor RequestCreated:", monitor1.data);

    const monitor2 = await contractClient.createEventMonitor({
      blockchain: "ARC-TESTNET",
      contractAddress: process.env.CONTRACT_ADDRESS,
      eventSignature: "RequestPaid(bytes32,address,uint256)",
    });
    console.log("✅ Monitor RequestPaid:", monitor2.data);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

createMonitors();

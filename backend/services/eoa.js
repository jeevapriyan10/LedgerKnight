const { ethers } = require('ethers');
const Institution = require('../models/Institution');
const { decrypt } = require('./crypto');

const RPC_URL = process.env.RPC_PROVIDER_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

function getProvider() {
    return new ethers.JsonRpcProvider(RPC_URL, null, {
        staticNetwork: true,
        batchMaxCount: 1,
    });
}

async function getInstitutionBalance(institutionId) {
    try {
        const inst = await Institution.findById(institutionId).lean();
        if (!inst || !inst.walletAddress) {
            throw new Error('Institution wallet not found');
        }

        const provider = getProvider();
        const balance = await provider.getBalance(inst.walletAddress);
        return ethers.formatEther(balance);
    } catch (error) {
        console.error('Error fetching balance:', error.message);
        throw new Error('Failed to fetch balance: ' + error.message);
    }
}

async function sendFromInstitution(institutionId, toAddress, amountEth) {
    try {
        const inst = await Institution.findById(institutionId).lean();
        if (!inst || !inst.walletKeyEnc) {
            throw new Error('Institution wallet not found');
        }

        const privateKey = decrypt(inst.walletKeyEnc);
        const provider = getProvider();
        const wallet = new ethers.Wallet(privateKey, provider);

        // Validate address
        if (!ethers.isAddress(toAddress)) {
            throw new Error('Invalid Ethereum address');
        }

        // Check balance
        const balance = await wallet.provider.getBalance(wallet.address);
        const amount = ethers.parseEther(amountEth.toString());

        if (balance < amount) {
            throw new Error('Insufficient balance');
        }

        // Send transaction
        const tx = await wallet.sendTransaction({
            to: toAddress,
            value: amount,
        });

        console.log('Transaction sent:', tx.hash);
        await tx.wait();
        console.log('Transaction confirmed:', tx.hash);

        return tx.hash;
    } catch (error) {
        console.error('Error sending transaction:', error.message);
        throw new Error('Failed to send transaction: ' + error.message);
    }
}

module.exports = {
    getInstitutionBalance,
    sendFromInstitution,
};

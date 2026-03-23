"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ethers, Contract, JsonRpcProvider, BrowserProvider, parseEther, formatEther } from "ethers";
import { STAKE_TOKEN_ABI, STAKING_ABI, STAKE_TOKEN_ADDRESS, STAKING_ADDRESS } from "./constants";
import { Wallet, Coins, ArrowDown, ArrowUp, Info, ExternalLink, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";

export default function StakingDashboard() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState("0");
  const [stakedBalance, setStakedBalance] = useState("0");
  const [earnedRewards, setEarnedRewards] = useState("0");
  const [overallTotalSupply, setOverallTotalSupply] = useState("0");
  const [stakeAmount, setStakeAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Contracts
  const getContracts = useCallback(async () => {
    if (!signer) return null;
    const token = new Contract(STAKE_TOKEN_ADDRESS, STAKE_TOKEN_ABI, signer);
    const staking = new Contract(STAKING_ADDRESS, STAKING_ABI, signer);
    return { token, staking };
  }, [signer]);

  const updateStats = useCallback(async () => {
    if (!account || !signer) return;
    try {
      const { token, staking } = (await getContracts())!;
      
      const [balance, staked, earned, supply] = await Promise.all([
        token.balanceOf(account),
        staking.balanceOf(account),
        staking.earned(account),
        staking.totalSupply(),
      ]);

      setUserBalance(formatEther(balance));
      setStakedBalance(formatEther(staked));
      setEarnedRewards(formatEther(earned));
      setOverallTotalSupply(formatEther(supply));
    } catch (err) {
      console.error("Stats update failed:", err);
    }
  }, [account, signer, getContracts]);

  // Connect Wallet
  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("MetaMask not found!");
      return;
    }
    try {
      // Use direct request as it's often more robust than browserProvider.send
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      const browserProvider = new BrowserProvider(window.ethereum);
      setAccount(accounts[0]);
      setProvider(browserProvider);
      
      const s = await browserProvider.getSigner();
      setSigner(s);
      toast.success("Wallet connected!");
    } catch (err: any) {
      console.error("Manual connection failed:", err);
      if (err.code === 4001) {
        toast.error("User rejected request");
      } else {
        toast.error(`Conn. Error: ${err.message || "Unknown error"}`);
      }
    }
  };

  useEffect(() => {
    if (account) {
      updateStats();
      const interval = setInterval(updateStats, 5000); // Polling every 5s
      return () => clearInterval(interval);
    }
  }, [account, updateStats]);

  // Core Actions
  const handleStake = async () => {
    if (!stakeAmount || isNaN(Number(stakeAmount))) return;
    setLoading(true);
    try {
      const { token, staking } = (await getContracts())!;
      const amount = parseEther(stakeAmount);
      
      // Approval check
      const allowance = await token.allowance(account, STAKING_ADDRESS);
      if (allowance < amount) {
        toast.loading("Approving STK...", { id: "tx" });
        const txApprove = await token.approve(STAKING_ADDRESS, amount);
        await txApprove.wait();
        toast.success("Approved!", { id: "tx" });
      }

      toast.loading("Staking...", { id: "tx" });
      const txStake = await staking.stake(amount);
      await txStake.wait();
      toast.success("Staked successfully!", { id: "tx" });
      setStakeAmount("");
      updateStats();
    } catch (err: any) {
      toast.error(err.reason || "Transaction failed", { id: "tx" });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) return;
    setLoading(true);
    try {
      const { staking } = (await getContracts())!;
      toast.loading("Withdrawing...", { id: "tx" });
      const tx = await staking.withdraw(parseEther(withdrawAmount));
      await tx.wait();
      toast.success("Withdrawn!", { id: "tx" });
      setWithdrawAmount("");
      updateStats();
    } catch (err: any) {
      toast.error(err.reason || "Transaction failed", { id: "tx" });
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    setLoading(true);
    try {
      const { staking } = (await getContracts())!;
      toast.loading("Claiming rewards...", { id: "tx" });
      const tx = await staking.claimReward();
      await tx.wait();
      toast.success("Rewards claimed!", { id: "tx" });
      updateStats();
    } catch (err: any) {
      toast.error(err.reason || "Transaction failed", { id: "tx" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      <Toaster position="bottom-right" />
      
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="border-b border-slate-800/50 backdrop-blur-md bg-slate-900/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform cursor-pointer">
              <Zap className="text-white w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">STK <span className="text-cyan-400">FINANCE</span></h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">Global Protocol</span>
            </div>
          </div>
          
          <button 
            onClick={connectWallet}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full transition-all active:scale-95 text-sm font-semibold shadow-xl"
          >
            <Wallet className="w-4 h-4" />
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <section className="mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-3"
          >
            Maximize Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">Wealth</span>
          </motion.h2>
          <p className="text-slate-400">Stake STK tokens and earn passive rewards at 10 STK/second. Efficient. Secure. Scalable.</p>
        </section>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <InfoCard title="Total Staked" value={`${overallTotalSupply} STK`} icon={<Coins className="text-cyan-400" />} />
          <InfoCard title="Your Wallet" value={`${userBalance} STK`} icon={<Wallet className="text-purple-400" />} />
          <InfoCard title="Your Stake" value={`${stakedBalance} STK`} icon={<ArrowUp className="text-green-400" />} />
          <InfoCard title="Unclaimed" value={`${earnedRewards} STK`} icon={<Zap className="text-yellow-400" />} />
        </div>

        {/* Interaction Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Staking Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                    <ArrowDown className="text-cyan-400 w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Staking Operations</h3>
                </div>
                <span className="bg-cyan-500/10 text-cyan-400 text-xs px-3 py-1 rounded-full border border-cyan-500/20 font-bold uppercase tracking-wider">Active Pool</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Stake Input */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-slate-400 flex justify-between">
                    Stake Amount
                    <button 
                      onClick={() => setStakeAmount(userBalance)}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] underline font-bold"
                    >
                      MAX
                    </button>
                  </label>
                  <div className="relative group/input">
                    <input 
                      type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500/50 outline-none rounded-2xl px-5 py-4 text-lg font-medium transition-all"
                      placeholder="0.0"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">STK</div>
                  </div>
                  <button 
                    onClick={handleStake} disabled={loading || !stakeAmount}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/20 rounded-2xl font-bold text-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Stake
                  </button>
                </div>

                {/* Withdraw Input */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-slate-400 flex justify-between">
                    Withdraw Amount
                    <button 
                      onClick={() => setWithdrawAmount(stakedBalance)}
                      className="text-red-400 hover:text-red-300 text-[11px] underline font-bold"
                    >
                      MAX
                    </button>
                  </label>
                  <div className="relative group/input">
                    <input 
                      type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500/50 outline-none rounded-2xl px-5 py-4 text-lg font-medium transition-all"
                      placeholder="0.0"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">STK</div>
                  </div>
                  <button 
                    onClick={handleWithdraw} disabled={loading || !withdrawAmount}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl font-bold text-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    Withdraw Stake
                  </button>
                </div>
              </div>
            </div>

            {/* Reward Card */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/60 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-yellow-500/10 rounded-full border border-yellow-500/20 animate-pulse">
                  <Zap className="text-yellow-400 w-8 h-8 fill-current" />
                </div>
                <div>
                  <h4 className="text-slate-400 font-medium mb-1 uppercase text-xs tracking-widest">Available Earnings</h4>
                  <div className="text-4xl font-black text-white">{Number(earnedRewards).toLocaleString(undefined, { minimumFractionDigits: 4 })} <span className="text-xl text-yellow-500 font-bold">STK</span></div>
                </div>
              </div>
              <button 
                onClick={handleClaim} disabled={loading || Number(earnedRewards) === 0}
                className="w-full md:w-auto px-12 py-5 bg-white text-slate-900 rounded-2xl font-black text-xl hover:bg-cyan-50 transition-all active:scale-95 disabled:opacity-50"
              >
                Claim Rewards
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                Security Analytics
              </h4>
              <ul className="space-y-4 text-sm">
                <li className="flex justify-between text-slate-400">
                  <span>Protocol Status</span>
                  <span className="text-green-400 font-bold">Audited & Safe</span>
                </li>
                <li className="flex justify-between text-slate-400">
                  <span>Reward Frequency</span>
                  <span className="text-slate-100">10 STK / sec</span>
                </li>
                <li className="flex justify-between text-slate-400">
                  <span>Precision Math</span>
                  <span className="text-slate-100">1e18 Scaling</span>
                </li>
              </ul>
            </div>

            <div className="bg-cyan-600/10 border border-cyan-500/20 p-6 rounded-3xl">
              <h4 className="font-bold mb-2">Protocol Deployment</h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">View the smart contracts directly on-chain to verify the immutable staking logic.</p>
              <div className="space-y-2">
                <AddressLink label="Token Contract" address={STAKE_TOKEN_ADDRESS} />
                <AddressLink label="Staking Engine" address={STAKING_ADDRESS} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-800 mt-12 text-center">
        <p className="text-slate-500 text-sm font-medium">Built by Sai Nithish | Pro Staking Protocol Portfolio Project</p>
      </footer>
    </div>
  );
}

function InfoCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:bg-slate-900/80 transition-all group"
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700/50 group-hover:border-cyan-500/30">
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-500 tracking-[0.1em] uppercase">{title}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
    </motion.div>
  );
}

function AddressLink({ label, address }: { label: string, address: string }) {
  return (
    <a 
      href={`https://sepolia.etherscan.io/address/${address}`} target="_blank"
      className="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-cyan-500/30 transition-all group"
    >
      <span className="text-xs text-slate-400">{label}</span>
      <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-cyan-400" />
    </a>
  );
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

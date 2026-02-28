import { Search, Wallet } from "lucide-react";

export default function TopBar() {
    return (
        <header className="h-16 border-b border-border bg-surface/50 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="relative w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background text-white placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Search markets, users, or topics..."
                />
            </div>

            <div className="flex items-center gap-4">
                <div className="text-xs text-muted flex gap-4 mr-4">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-positive inline-block"></span> Global Vol: $45.2M</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block"></span> 24h Users: 12.4K</span>
                </div>
                <button className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-4 py-2 rounded-md font-medium transition-colors text-sm">
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                </button>
            </div>
        </header>
    );
}

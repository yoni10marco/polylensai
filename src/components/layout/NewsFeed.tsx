import { Clock, TrendingDown, TrendingUp } from "lucide-react";

type NewsItem = {
    id: string;
    title: string;
    timestamp: string;
    sentiment: "Positive" | "Negative" | "Neutral";
    impactScore: number;
};

const MOCK_NEWS: NewsItem[] = [
    { id: "1", title: "New swing state poll shows tightening race in PA", timestamp: "10m ago", sentiment: "Neutral", impactScore: 8 },
    { id: "2", title: "Major debate performance shifts overall odds", timestamp: "1h ago", sentiment: "Positive", impactScore: 9 },
    { id: "3", title: "Key endorsement missed, odds drop 2%", timestamp: "3h ago", sentiment: "Negative", impactScore: 6 },
    { id: "4", title: "Record volume traded on Swing State markets today", timestamp: "5h ago", sentiment: "Positive", impactScore: 4 },
    { id: "5", title: "Campaign finance report reveals cash disadvantage", timestamp: "12h ago", sentiment: "Negative", impactScore: 7 },
];

export default function NewsFeed() {
    return (
        <aside className="w-80 border-l border-border bg-surface flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-white flex items-center gap-2">
                    Live News Feed
                </h2>
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {MOCK_NEWS.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${item.sentiment === 'Positive' ? 'bg-positive/10 text-positive' :
                                    item.sentiment === 'Negative' ? 'bg-negative/10 text-negative' :
                                        'bg-muted/10 text-muted'
                                }`}>
                                {item.sentiment}
                            </span>
                            <div className="flex items-center gap-1 text-xs font-bold font-mono">
                                <span className="text-muted mr-1">Impact:</span>
                                <span className={`px-1.5 rounded ${item.impactScore >= 8 ? 'bg-primary/20 text-primary' : item.impactScore >= 6 ? 'text-white' : 'text-muted'}`}>
                                    {item.impactScore}/10
                                </span>
                            </div>
                        </div>

                        <h3 className="text-sm font-medium text-white mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-relaxed">
                            {item.title}
                        </h3>

                        <div className="flex items-center text-xs text-muted">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.timestamp}
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}

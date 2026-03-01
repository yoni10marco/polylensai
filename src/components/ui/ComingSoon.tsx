import { Construction } from "lucide-react";
import Link from "next/link";

interface ComingSoonProps {
    title?: string;
    description?: string;
    backHref?: string;
    backLabel?: string;
}

export default function ComingSoon({
    title = "Coming Soon",
    description = "This section is under development. Check back soon for new features.",
    backHref = "/dashboard",
    backLabel = "Back to Dashboard",
}: ComingSoonProps) {
    return (
        <div className="flex-1 flex items-center justify-center min-h-[500px]">
            <div className="flex flex-col items-center text-center max-w-sm gap-5">
                {/* Animated icon */}
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_40px_rgba(56,189,248,0.15)]">
                        <Construction className="w-9 h-9 text-primary" />
                    </div>
                    {/* Pulse ring */}
                    <span className="absolute inset-0 rounded-2xl border border-primary/30 animate-ping opacity-40" />
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-muted text-sm leading-relaxed">{description}</p>
                </div>

                <Link
                    href={backHref}
                    className="mt-2 px-6 py-2.5 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors rounded-lg font-semibold text-sm"
                >
                    {backLabel}
                </Link>
            </div>
        </div>
    );
}

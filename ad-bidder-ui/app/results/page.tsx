import { Header } from "@/components/Header";
import { ResultsDashboard } from "@/components/dashboard";

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <ResultsDashboard />
      </main>
    </div>
  );
}

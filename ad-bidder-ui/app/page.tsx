import { Header } from "@/components/Header";
import { CampaignForm } from "@/components/forms";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Create Campaign
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your advertising campaign parameters and let our AI
            optimize your budget allocation across demographic segments.
          </p>
        </div>
        <CampaignForm />
      </main>
    </div>
  );
}

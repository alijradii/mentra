import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Mentra</h1>
      <p className="text-muted-foreground">
        Next.js frontend — edit <code className="rounded bg-muted px-2 py-1">app/page.tsx</code>
      </p>
      <div className="flex gap-4">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
      </div>
    </main>
  );
}

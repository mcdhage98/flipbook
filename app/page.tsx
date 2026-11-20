import { FlipbookLoader } from "@/components/FlipbookLoader";

export default function HomePage() {
  return (
    <main>
      <header className="masthead">
        <p className="eyebrow">Self-coaching guide</p>
        <h1>Leading from the Inside Out</h1>
        <p>Fill in the first page, turn through the guide, then download a PDF with your cover in front.</p>
      </header>
      <FlipbookLoader />
    </main>
  );
}

import { Palette } from "./Palette.tsx";

const SCALES = ["neutral", "accent", "brand"];

export function App() {
  return (
    <main className="sheet">
      {SCALES.map((scale) => (
        <Palette key={scale} scale={scale} />
      ))}
    </main>
  );
}

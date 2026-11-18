import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { ComponentsPage } from "./ComponentsPage.tsx";
import "./style.css";

/** Hash routes, so the static build works from any folder (e.g. GitHub Pages). */
const PAGES = [
  { hash: "#/", label: "Palettes" },
  { hash: "#/components", label: "Components" },
] as const;

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function Root() {
  const hash = useHash();
  const onComponents = hash === "#/components";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [onComponents]);

  return (
    <>
      <nav className="site-nav" aria-label="Pages">
        {PAGES.map((page) => {
          const current = page.hash === "#/components" ? onComponents : !onComponents;
          return (
            <a
              key={page.hash}
              href={page.hash}
              className="site-nav__link"
              aria-current={current ? "page" : undefined}
            >
              {page.label}
            </a>
          );
        })}
      </nav>
      {onComponents ? <ComponentsPage /> : <App />}
    </>
  );
}

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

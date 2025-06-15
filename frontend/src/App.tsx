import ChapterStudio from "./pages/ChapterStudio";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-secondary text-primary">
      <header className="p-4 shadow-md bg-card text-white font-semibold text-xl">
        📖 Vyomketu’s Book Builder
      </header>
      <main className="flex-1 p-6">
        <ChapterStudio />
      </main>
    </div>
  );
}

export default App;

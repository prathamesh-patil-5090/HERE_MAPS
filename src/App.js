import './App.css';
import BarberShopsMap from './components/BarberShopsMap';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>Barber Shop Finder</h1>
        <p>Find the best barber shops near you</p>
      </header>
      <main className="app-main">
        <BarberShopsMap />
      </main>
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Barber Shop Finder. Powered by HERE Maps</p>
      </footer>
    </div>
  );
}

export default App;

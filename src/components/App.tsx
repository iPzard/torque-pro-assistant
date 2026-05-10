import { useEffect } from 'react';
import Titlebar from './titlebar/Titlebar';
import { get } from '../utils/requests';
import styles from './App.module.scss';

function App() {
  useEffect(() => {
    get<string>(
      'ping',
      (response) => console.log('Flask /ping:', response),
      (error) => console.error('Flask /ping failed:', error)
    );
  }, []);

  return (
    <>
      <Titlebar />
      <main className={ styles.app }>
        <h1>Torque Pro Assistant</h1>
        <p>Foundation scaffold — UI lands in step 4.</p>
      </main>
    </>
  );
}

export default App;

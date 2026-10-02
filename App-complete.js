import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [analyses, setAnalyses] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadClients(currentUser.uid);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setView('dashboard');
  };

  const loadClients = async (coachId) => {
    try {
      const q = query(
        collection(db, 'clients'),
        where('coachId', '==', coachId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setClients(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadAnalyses = async (clientId) => {
    try {
      const q = query(
        collection(db, 'analyses'),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setAnalyses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error loading analyses:', error);
    }
  };

  const addClient = async (name, age, goal) => {
    if (!name.trim()) return alert('Client name required');
    try {
      await addDoc(collection(db, 'clients'), {
        coachId: user.uid,
        name,
        age: age || null,
        goal: goal || '',
        createdAt: new Date(),
        notes: ''
      });
      await loadClients(user.uid);
      setView('dashboard');
    } catch (error) {
      alert('Error adding client: ' + error.message);
    }
  };

  const deleteClient = async (clientId) => {
    if (!window.confirm('Delete this client and all analyses?')) return;
    try {
      const q = query(collection(db, 'analyses'), where('clientId', '==', clientId));
      const snapshot = await getDocs(q);
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
      await deleteDoc(doc(db, 'clients', clientId));
      await loadClients(user.uid);
      setView('dashboard');
    } catch (error) {
      alert('Error deleting client: ' + error.message);
    }
  };

  const saveAnalysis = async (analysisData) => {
    try {
      await addDoc(collection(db, 'analyses'), {
        clientId: selectedClient.id,
        coachId: user.uid,
        ...analysisData,
        createdAt: new Date(),
        feedback: { accurate: null, notes: '' }
      });
      await loadAnalyses(selectedClient.id);
      setView('client-detail');
    } catch (error) {
      alert('Error saving analysis: ' + error.message);
    }
  };

  const updateAnalysisFeedback = async (analysisId, accurate, notes) => {
    try {
      await updateDoc(doc(db, 'analyses', analysisId), {
        feedback: { accurate, notes }
      });
      await loadAnalyses(selectedClient.id);
    } catch (error) {
      alert('Error updating feedback: ' + error.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ 
        padding: '100px 20px', 
        textAlign: 'center',
        backgroundColor: '#f0f0f0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>CoachFlow AI</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>Coaching Dashboard</p>
        <button 
          onClick={loginWithGoogle}
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            backgroundColor: '#0891b2',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Header user={user} logout={logout} />
      
      {view === 'dashboard' && (
        <DashboardView 
          clients={clients}
          onSelectClient={(c) => { setSelectedClient(c); loadAnalyses(c.id); setView('client-detail'); }}
          onNewClient={() => setView('new-client')}
          onDeleteClient={deleteClient}
        />
      )}
      
      {view === 'new-client' && (
        <NewClientForm onSubmit={addClient} onCancel={() => setView('dashboard')} />
      )}
      
      {view === 'client-detail' && selectedClient && (
        <ClientDetailView
          client={selectedClient}
          analyses={analyses}
          onNewAnalysis={() => setView('new-analysis')}
          onBack={() => setView('dashboard')}
          onUpdateFeedback={updateAnalysisFeedback}
        />
      )}
      
      {view === 'new-analysis' && selectedClient && (
        <NewAnalysisForm
          client={selectedClient}
          onSubmit={saveAnalysis}
          onCancel={() => setView('client-detail')}
        />
      )}
    </div>
  );
}

function Header({ user, logout }) {
  return (
    <header style={{ 
      backgroundColor: 'white', 
      borderBottom: '1px solid #e5e7eb',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>CoachFlow AI</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>{user.email}</span>
        <button 
          onClick={logout}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

function DashboardView({ clients, onSelectClient, onNewClient, onDeleteClient }) {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>Your Clients</h2>
          <p style={{ margin: '8px 0 0 0', color: '#666' }}>{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button 
          onClick={onNewClient}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0891b2',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Add Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '48px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#666'
        }}>
          <p>No clients yet. Add your first client to get started.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {clients.map(c => (
            <div 
              key={c.id}
              onClick={() => onSelectClient(c)}
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{c.name}</h3>
                  {c.age && <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>{c.age} years old</p>}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteClient(c.id); }}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#dc2626',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  Delete
                </button>
              </div>
              {c.goal && <p style={{ margin: '8px 0', color: '#666', fontSize: '14px' }}>Goal: {c.goal}</p>}
              <p style={{ margin: '12px 0 0 0', paddingTop: '12px', borderTop: '1px solid #e5e7eb', color: '#666', fontSize: '13px' }}>
                View details and analysis history
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewClientForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState('');

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ marginBottom: '24px' }}>Add New Client</h2>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>Client Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Sarah"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g., 28"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>Goal</label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Lose 15 lbs"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onSubmit(name, age, goal)}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#0891b2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Add Client
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientDetailView({ client, analyses, onNewAnalysis, onBack, onUpdateFeedback }) {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <button
        onClick={onBack}
        style={{
          marginBottom: '24px',
          backgroundColor: 'transparent',
          color: '#0891b2',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        ← Back to Clients
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{client.name}</h2>
          {client.age && <p style={{ margin: '8px 0 0 0', color: '#666' }}>{client.age} years old</p>}
          {client.goal && <p style={{ margin: '4px 0 0 0', color: '#666' }}>Goal: {client.goal}</p>}
        </div>
        <button
          onClick={onNewAnalysis}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0891b2',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          New Analysis
        </button>
      </div>

      <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>Analysis History</h3>

      {analyses.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#666'
        }}>
          <p>No analyses yet. Create your first analysis.</p>
        </div>
      ) : (
        <div style={{ space: '16px' }}>
          {analyses.map(a => (
            <AnalysisCard 
              key={a.id} 
              analysis={a} 
              onUpdateFeedback={onUpdateFeedback}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AnalysisCard({ analysis, onUpdateFeedback }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [accurate, setAccurate] = useState(analysis.feedback?.accurate);
  const [notes, setNotes] = useState(analysis.feedback?.notes || '');

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{formatDate(analysis.createdAt)}</p>
        {analysis.feedback?.accurate !== null && (
          <span style={{
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor: analysis.feedback.accurate ? '#d1fae5' : '#fed7aa',
            color: analysis.feedback.accurate ? '#065f46' : '#92400e'
          }}>
            {analysis.feedback.accurate ? 'Accurate' : 'Needs Work'}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase' }}>Calorie Rec</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>{analysis.calorieRecommendation}</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase' }}>Macros</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>P: {analysis.macros?.protein}g</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px' }}>C: {analysis.macros?.carbs}g</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px' }}>F: {analysis.macros?.fat}g</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase' }}>Inputs</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>Cal: {analysis.inputs?.dailyCalories}</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px' }}>Weight: {analysis.inputs?.weightChange}</p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Hidden Bottleneck</p>
        <p style={{ margin: 0, fontSize: '13px', color: '#374151', fontStyle: 'italic' }}>{analysis.bottleneckAnalysis}</p>
      </div>

      <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '6px', marginBottom: '16px', borderLeft: '3px solid #0891b2' }}>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#1e40af', marginBottom: '8px' }}>Coach Script</p>
        <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', fontStyle: 'italic' }}>{analysis.coachScript}</p>
      </div>

      <button
        onClick={() => setShowFeedback(!showFeedback)}
        style={{
          backgroundColor: 'transparent',
          color: '#0891b2',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 'bold'
        }}
      >
        {showFeedback ? 'Hide Feedback' : 'Add Feedback'}
      </button>

      {showFeedback && (
        <div style={{ marginTop: '16px', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '6px' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>Was this accurate?</p>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={() => setAccurate(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: accurate === true ? '#16a34a' : '#e5e7eb',
                color: accurate === true ? 'white' : '#1f2937',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              Yes
            </button>
            <button
              onClick={() => setAccurate(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: accurate === false ? '#d97706' : '#e5e7eb',
                color: accurate === false ? 'white' : '#1f2937',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              No
            </button>
          </div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What was off?"
            rows="3"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '13px',
              boxSizing: 'border-box',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          />
          <button
            onClick={() => {
              onUpdateFeedback(analysis.id, accurate, notes);
              setShowFeedback(false);
            }}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              backgroundColor: '#0891b2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px'
            }}
          >
            Save Feedback
          </button>
        </div>
      )}
    </div>
  );
}

function NewAnalysisForm({ client, onSubmit, onCancel }) {
  const [dailyCalories, setDailyCalories] = useState('');
  const [weightChange, setWeightChange] = useState('');
  const [averageSleep, setAverageSleep] = useState('');
  const [stressLevels, setStressLevels] = useState('');
  const [adherence, setAdherence] = useState('');
  const [clientComments, setClientComments] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dailyCalories || !weightChange || !averageSleep || !stressLevels || !adherence) {
      alert('Please fill all fields');
      return;
    }

    const analysis = generateAnalysis(
      parseInt(dailyCalories),
      weightChange,
      averageSleep,
      stressLevels,
      adherence,
      clientComments
    );

    onSubmit({
      inputs: { dailyCalories: parseInt(dailyCalories), weightChange, averageSleep, stressLevels, adherence, clientComments },
      ...analysis
    });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
      <button
        onClick={onCancel}
        style={{
          marginBottom: '24px',
          backgroundColor: 'transparent',
          color: '#0891b2',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        ← Back
      </button>

      <h2 style={{ marginBottom: '24px' }}>New Analysis for {client.name}</h2>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>Client Data</h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Daily Calories</label>
            <input
              type="number"
              value={dailyCalories}
              onChange={(e) => setDailyCalories(e.target.value)}
              placeholder="e.g., 2100"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Weight Change</label>
            <select
              value={weightChange}
              onChange={(e) => setWeightChange(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select...</option>
              <option value="dropping">Dropping (down 1+ lbs)</option>
              <option value="stalled">Stalled (±0.5 lbs)</option>
              <option value="gaining">Gaining (up 1+ lbs)</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Average Sleep</label>
            <select
              value={averageSleep}
              onChange={(e) => setAverageSleep(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select...</option>
              <option value="excellent">Excellent (7-8 hours)</option>
              <option value="decent">Decent (6-7 hours)</option>
              <option value="poor">Poor (less than 6 hours)</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Stress Levels</label>
            <select
              value={stressLevels}
              onChange={(e) => setStressLevels(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select...</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Adherence to Plan</label>
            <select
              value={adherence}
              onChange={(e) => setAdherence(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select...</option>
              <option value="high">90-100%</option>
              <option value="moderate">70-90%</option>
              <option value="low">Below 70%</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Client Comments</label>
            <textarea
              value={clientComments}
              onChange={(e) => setClientComments(e.target.value)}
              placeholder="Optional notes from client..."
              rows="4"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#0891b2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Generate Analysis
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#f3f4f6',
                color: '#1f2937',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '8px', height: 'fit-content' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e40af', marginBottom: '16px' }}>This Analyzes</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#1e40af', fontSize: '13px', lineHeight: '1.8' }}>
            <li>Weight trend + adherence</li>
            <li>Sleep as primary lever</li>
            <li>Stress + sleep interaction</li>
            <li>Macro split targets</li>
            <li>Personalized coach script</li>
          </ul>
        </div>
      </form>
    </div>
  );
}

function generateAnalysis(dailyCalories, weightChange, averageSleep, stressLevels, adherence, clientComments) {
  let calorieChange = 0;
  let rationale = '';

  if (weightChange === 'dropping') {
    if (adherence === 'high') {
      calorieChange = 50;
      rationale = 'Client responding well. Increase slightly to sustain.';
    } else if (adherence === 'moderate') {
      calorieChange = 0;
      rationale = 'Hold steady. Consistency is working.';
    } else {
      calorieChange = 100;
      rationale = 'Support the win. Add calories to rebuild compliance.';
    }
  } else if (weightChange === 'stalled') {
    if (adherence === 'high') {
      calorieChange = -200;
      rationale = 'High adherence but no movement. Create deficit.';
    } else if (adherence === 'moderate') {
      calorieChange = -100;
      rationale = 'Modest adjustment. Focus on consistency first.';
    } else {
      calorieChange = 0;
      rationale = 'Hold calories. Improve adherence before cutting.';
    }
  } else if (weightChange === 'gaining') {
    if (adherence === 'high') {
      calorieChange = -150;
      rationale = 'Unexpected gain. Drop calories.';
    } else if (adherence === 'moderate') {
      calorieChange = -100;
      rationale = 'Modest cut. Investigate adherence.';
    } else {
      calorieChange = -200;
      rationale = 'Low adherence causing gain. Reduce baseline.';
    }
  }

  const newCalories = dailyCalories + calorieChange;
  let displayText = '';
  if (calorieChange > 0) {
    displayText = `Increase +${calorieChange} kcal (${dailyCalories} → ${newCalories})`;
  } else if (calorieChange < 0) {
    displayText = `Decrease ${calorieChange} kcal (${dailyCalories} → ${newCalories})`;
  } else {
    displayText = `Hold at ${dailyCalories} kcal`;
  }

  const proteinGrams = Math.round((newCalories * 0.3) / 4);
  const fatGrams = Math.round((newCalories * 0.25) / 9);
  const carbGrams = Math.round((newCalories * 0.45) / 4);

  let bottleneckText = '';
  let priorityAction = '';

  if (averageSleep === 'poor') {
    bottleneckText = 'Sleep deficit is the primary lever. Poor sleep suppresses appetite hormones and increases cortisol. This alone can override calorie discipline.';
    priorityAction = 'Sleep first—aim for 7+ hours. Reassess calories after 1 week.';
  } else if (averageSleep === 'decent') {
    if (stressLevels === 'high') {
      bottleneckText = 'Stress and borderline sleep are dangerous together. High cortisol is triggering emotional eating. Client needs stress management more than calorie cuts.';
      priorityAction = 'Add stress management. Sleep stays priority.';
    } else {
      bottleneckText = 'Sleep is adequate. The issue is likely adherence. Review the week: which moments broke the plan?';
      priorityAction = 'Identify the specific adherence slip. Tweak that one thing.';
    }
  } else if (averageSleep === 'excellent') {
    if (stressLevels === 'high') {
      bottleneckText = 'Great sleep despite high stress. Sleep is cushioning the stress. Client is resilient.';
      priorityAction = 'Respect the good sleep. Stress is secondary.';
    } else if (adherence === 'low') {
      bottleneckText = 'Sleep and stress are optimal. The bottleneck is pure adherence. The plan might be too complex.';
      priorityAction = 'Simplify the diet. Make compliance the north star.';
    } else {
      bottleneckText = 'No hidden bottleneck. Everything is solid. Adjust calories slightly and reassess.';
      priorityAction = 'Keep the current protocol. Microadjust only.';
    }
  }

  let script = '';
  if (weightChange === 'dropping') {
    if (adherence === 'high') {
      script = `"I'm seeing great progress this week. You're showing the consistency I've been waiting for. Let's bump calories up slightly. This keeps you feeling strong. Keep crushing it."`;
    } else if (adherence === 'moderate') {
      script = `"Good news—the scale moved. We're exactly where we need to be. Calories stay the same. Your job this week is three perfect days. Small wins compound. You've got this."`;
    } else {
      script = `"The scale moved—and that matters. I know adherence was shaky, but you still got a win. We're adding calories back. Focus on just showing up. You don't need to be perfect."`;
    }
  } else if (weightChange === 'stalled') {
    if (averageSleep === 'poor') {
      script = `"No movement, but I know why: sleep is your lever, not calories. When you're at 5 hours, your body fights you. Let's prioritize sleep—bed 30 minutes earlier. I promise you'll see movement."`;
    } else if (stressLevels === 'high' && averageSleep === 'decent') {
      script = `"We're stalled, but that's information. You've got a lot on your plate. Let's not cut calories. Add a 15-minute walk and one good night. You need recovery, not restriction."`;
    } else if (adherence === 'high') {
      script = `"Stalled week, but I'm not worried. You've been dialed and disciplined. The body needs a new signal. We're dropping 200 calories. It's modest, and I believe you're ready."`;
    } else {
      script = `"We're stuck. Before we change calories, can you nail 80% adherence this week? Prove it to yourself first. Then we'll make a small cut. One thing at a time."`;
    }
  } else if (weightChange === 'gaining') {
    if (stressLevels === 'high') {
      script = `"You gained this week, and I see the stress is real. Your body is holding weight because cortisol is elevated. Drop 200 and add one stress-relief activity. You need both."`;
    } else if (averageSleep === 'poor') {
      script = `"Gaining and sleep is tanked—they're connected. Poor sleep cranks up hunger hormones. Drop 150 calories, but more importantly, sleep on time. I bet you drop 2 pounds just from better sleep."`;
    } else if (adherence === 'low') {
      script = `"Tough week. You know what went wrong. We're dropping 200, but more importantly, simplify. Three meals you know work. Eat those on repeat. Stop overthinking."`;
    } else {
      script = `"Unexpected gain despite good effort. Something shifted. Drop 150 calories and add one walk. We'll dial it in this week."`;
    }
  }

  return {
    calorieRecommendation: displayText,
    calorieRationale: rationale,
    macros: { protein: proteinGrams, carbs: carbGrams, fat: fatGrams },
    bottleneckAnalysis: bottleneckText,
    priorityAction,
    coachScript: script
  };
}

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch, deleteDoc, updateDoc, arrayUnion, orderBy } from 'firebase/firestore';
import { ArrowRight, Users, IndianRupee, LogOut, PlusCircle, Trash2, Sun, Moon, Eye, X, UserPlus, Receipt, History, AlertTriangle, CheckCircle } from 'lucide-react';

// --- Firebase Configuration for Vercel ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
};

// --- CRITICAL: Check if Firebase keys are loaded ---
const firebaseKeysLoaded = firebaseConfig.apiKey && firebaseConfig.projectId;

const appId = 'split-smarter-live'; // Use a consistent ID for database paths

// --- Firebase Initialization (only if keys are present) ---
let app, auth, db;
if (firebaseKeysLoaded) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

// --- Helper & UI Components ---
const GoogleLogo = () => (
    <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,36.218,44,30.556,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const Logo = () => (
    <div className="flex items-center space-x-3">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 sm:w-10 sm:h-10">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" className="stroke-blue-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 12H8" className="stroke-green-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16V8" className="stroke-green-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Split Smarter</span>
    </div>
);

const Spinner = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
);

const Modal = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md m-4 border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
                    <X className="h-6 w-6" />
                </button>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    </div>
);

const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => (
    <Modal onClose={onCancel} title={title}>
        <div className="text-gray-800 dark:text-white">
            <p className="mb-6">{message}</p>
            <div className="flex justify-end space-x-4">
                <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                    Cancel
                </button>
                <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
                    Confirm
                </button>
            </div>
        </div>
    </Modal>
);


const ThemeToggle = ({ theme, setTheme }) => {
    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    return (
        <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
    );
};

const UserAvatar = ({ name }) => {
    const getInitials = (name) => {
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getColor = (name) => {
        const colors = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash % colors.length)];
    };

    return (
        <div className={`w-10 h-10 rounded-full ${getColor(name)} flex items-center justify-center text-white font-bold text-sm`}>
            {getInitials(name)}
        </div>
    );
};

// --- Main Application Components ---

const LoginScreen = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            const userDocRef = doc(db, `/artifacts/${appId}/public/data/users`, user.uid);
            await setDoc(userDocRef, { 
                username: user.displayName, 
                email: user.email,
                uid: user.uid 
            }, { merge: true });
        } catch (error) {
            console.error("Google login failed:", error);
            setError("Failed to sign in with Google. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm text-center">
                <div className="mb-8">
                    <Logo />
                    <p className="text-gray-500 dark:text-gray-400 mt-2">The simplest way to split expenses.</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-6">Welcome!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">Sign in to manage your shared expenses.</p>
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        {isLoading ? <Spinner /> : <><GoogleLogo /> Sign in with Google</>}
                    </button>
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                </div>
            </div>
        </div>
    );
};


const GroupSetupModal = ({ onGroupCreated, onClose, user }) => {
    const [members, setMembers] = useState(['']);
    const [groupName, setGroupName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleMemberChange = (index, value) => {
        const newMembers = [...members];
        newMembers[index] = value;
        setMembers(newMembers);
    };

    const addMemberField = () => setMembers([...members, '']);
    const removeMemberField = (index) => setMembers(members.filter((_, i) => i !== index));

    const handleCreateGroup = async (e) => {
        if(e) e.preventDefault();
        const finalMembers = [user.username, ...members.map(m => m.trim()).filter(m => m && m.toLowerCase() !== user.username.toLowerCase())];
        const uniqueMembers = [...new Set(finalMembers)];

        if (uniqueMembers.length < 2 || !groupName.trim()) {
            alert("Group must have a name and at least 2 unique members (including you).");
            return;
        }
        setIsLoading(true);
        try {
            const groupData = {
                name: groupName.trim(),
                members: uniqueMembers,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
            };
            const groupCollectionPath = `/artifacts/${appId}/public/data/groups`;
            const groupRef = await addDoc(collection(db, groupCollectionPath), groupData);
            
            await addDoc(collection(db, `${groupCollectionPath}/${groupRef.id}/expenses`), { placeholder: true });

            onGroupCreated(groupRef.id);
        } catch (error) {
            console.error("Error creating group:", error);
            alert("Failed to create group. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <Modal onClose={onClose} title="Create a New Group">
            <form onSubmit={handleCreateGroup} className="space-y-4">
                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g., Trip to Goa" className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"/>
                <div>
                    <label className="text-gray-500 dark:text-gray-400">Your name: <span className="font-bold text-gray-800 dark:text-white">{user.username}</span> (auto-added)</label>
                </div>
                <div>
                    <label className="text-gray-500 dark:text-gray-400">Add other members:</label>
                    {members.map((member, index) => (
                        <div key={index} className="flex items-center mt-2">
                            <input type="text" value={member} onChange={(e) => handleMemberChange(index, e.target.value)} placeholder={`Member ${index + 2}`} className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"/>
                            <button type="button" onClick={() => removeMemberField(index)} className="ml-2 text-red-500 hover:text-red-400 p-2 rounded-full bg-gray-200 dark:bg-gray-600">
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addMemberField} className="text-green-500 hover:text-green-400 mt-2 flex items-center">
                       <PlusCircle className="w-5 h-5 mr-2" /> Add Member
                    </button>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-3 rounded-lg flex justify-center items-center transition-transform transform hover:scale-105 disabled:opacity-50">
                    {isLoading ? <Spinner /> : "Create Group"}
                </button>
            </form>
        </Modal>
    );
};

const GroupHub = ({ user, onSelectGroup, theme, setTheme }) => {
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);

    useEffect(() => {
        if (!user || !user.username) {
            setIsLoading(false);
            return;
        }
        const groupsRef = collection(db, `/artifacts/${appId}/public/data/groups`);
        const q = query(groupsRef, where("members", "array-contains", user.username));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGroups(userGroups);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching groups:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleLogout = async () => {
        await signOut(auth);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmation) return;
        const groupId = deleteConfirmation;
        setDeleteConfirmation(null);
        try {
            const groupDocRef = doc(db, `/artifacts/${appId}/public/data/groups`, groupId);
            const expensesCollectionRef = collection(db, `/artifacts/${appId}/public/data/groups/${groupId}/expenses`);
            
            const expensesSnapshot = await getDocs(expensesCollectionRef);
            const batch = writeBatch(db);
            expensesSnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            await deleteDoc(groupDocRef);

        } catch (error) {
            console.error("Error deleting group:", error);
            alert("Failed to delete group.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <Logo />
                    <div className="flex items-center space-x-4">
                        <ThemeToggle theme={theme} setTheme={setTheme} />
                        <button onClick={handleLogout} className="bg-gray-200 dark:bg-gray-700 hover:bg-red-500 hover:text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                            <LogOut className="w-5 h-5 sm:mr-2" /> <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </header>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold">Your Groups</h2>
                    <button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-transform transform hover:scale-105">
                        <PlusCircle className="w-5 h-5 mr-2" /> Create Group
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center mt-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">You're not in any groups yet.</p>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Create one to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map(group => (
                            <div key={group.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                                <div className="p-6 flex-grow">
                                    <h3 className="text-xl font-bold truncate">{group.name}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">{group.members.length} members</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center rounded-b-2xl">
                                    <div className="flex space-x-2">
                                        <button onClick={() => setShowMembersModal(group.members)} title="View Members" className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"><Eye /></button>
                                        <button onClick={() => setDeleteConfirmation(group.id)} title="Delete Group" className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"><Trash2 /></button>
                                    </div>
                                    <button onClick={() => onSelectGroup(group.id)} className="font-bold text-green-600 dark:text-green-400 hover:underline">Open</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {showCreateModal && <GroupSetupModal user={user} onClose={() => setShowCreateModal(false)} onGroupCreated={(id) => { setShowCreateModal(false); onSelectGroup(id); }} />}
            {showMembersModal && (
                <Modal onClose={() => setShowMembersModal(null)} title="Group Members">
                    <ul className="space-y-2">
                        {showMembersModal.map(member => (
                            <li key={member} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white flex items-center">
                                <UserAvatar name={member} />
                                <span className="ml-4">{member}</span>
                            </li>
                        ))}
                    </ul>
                </Modal>
            )}
            {deleteConfirmation && (
                <ConfirmationModal 
                    title="Delete Group"
                    message="Are you sure you want to delete this group? All associated expenses will be lost. This action cannot be undone."
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteConfirmation(null)}
                />
            )}
        </div>
    );
};

// --- Dashboard & Expense Components (Unchanged from previous version) ---

const AddMemberModal = ({ group, onClose, onMemberAdded }) => {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAdd = async (e) => {
        if(e) e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError("Member name cannot be empty.");
            return;
        }
        if (group.members.some(m => m.toLowerCase() === trimmedName.toLowerCase())) {
            setError("This member is already in the group.");
            return;
        }
        
        setIsLoading(true);
        setError('');
        try {
            await onMemberAdded(trimmedName);
            onClose();
        } catch (e) {
            setError("Failed to add member. Please try again.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal onClose={onClose} title="Add New Member">
            <form onSubmit={handleAdd} className="space-y-4">
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="New member's name" 
                    className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-3 rounded-lg flex justify-center items-center transition-transform transform hover:scale-105 disabled:opacity-50">
                    {isLoading ? <Spinner /> : "Add Member"}
                </button>
            </form>
        </Modal>
    );
};

const AddExpenseModal = ({ members, onAddExpense, onClose }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState(members[0]);
    const [splitType, setSplitType] = useState('Equal');
    const [involved, setInvolved] = useState(members.reduce((acc, m) => ({ ...acc, [m]: true }), {}));
    const [unequalAmounts, setUnequalAmounts] = useState(members.reduce((acc, m) => ({ ...acc, [m]: '' }), {}));

    const handleAddExpense = (e) => {
        if(e) e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!description || isNaN(numAmount) || numAmount <= 0) {
            alert("Please fill in a valid description and amount.");
            return;
        }

        const participants = members.filter(m => involved[m]);
        if (participants.length === 0) {
            alert("At least one person must be involved in the expense.");
            return;
        }
        
        let finalSplits;
        if (splitType === 'Equal') {
            const splitAmount = numAmount / participants.length;
            finalSplits = participants.reduce((acc, p) => ({ ...acc, [p]: splitAmount }), {});
        } else {
            const totalUnequal = participants.reduce((sum, p) => sum + (parseFloat(unequalAmounts[p]) || 0), 0);
            if (Math.abs(totalUnequal - numAmount) > 0.01) {
                alert("The sum of unequal splits must match the total amount.");
                return;
            }
            finalSplits = participants.reduce((acc, p) => ({ ...acc, [p]: parseFloat(unequalAmounts[p]) || 0 }), {});
        }

        onAddExpense({ description, amount: numAmount, paidBy, splits: finalSplits, type: 'group' });
        onClose();
    };

    const involvedMembers = members.filter(m => involved[m]);

    return (
        <Modal onClose={onClose} title="Add Group Expense">
            <form onSubmit={handleAddExpense} className="space-y-4 text-gray-800 dark:text-white">
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (e.g., Dinner)" className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"/>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"/>
                <div>
                    <label className="text-gray-500 dark:text-gray-400">Paid by:</label>
                    <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-green-500">
                        {members.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div>
                     <label className="text-gray-500 dark:text-gray-400">Split:</label>
                    <div className="flex mt-1 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
                        <button type="button" onClick={() => setSplitType('Equal')} className={`w-1/2 p-2 rounded-md transition ${splitType === 'Equal' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Equal</button>
                        <button type="button" onClick={() => setSplitType('Unequal')} className={`w-1/2 p-2 rounded-md transition ${splitType === 'Unequal' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Unequal</button>
                    </div>
                </div>
                <div>
                    <label className="text-gray-500 dark:text-gray-400">Participants:</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {members.map(m => (
                            <label key={m} className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition ${involved[m] ? 'bg-gray-200 dark:bg-gray-600' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                <input type="checkbox" checked={involved[m]} onChange={e => setInvolved({...involved, [m]: e.target.checked})} className="form-checkbox h-5 w-5 text-green-500 bg-gray-300 dark:bg-gray-800 border-gray-400 dark:border-gray-600 rounded focus:ring-green-500"/>
                                <span>{m}</span>
                            </label>
                        ))}
                    </div>
                </div>
                {splitType === 'Unequal' && (
                    <div>
                        <label className="text-gray-500 dark:text-gray-400">Unequal Amounts:</label>
                        {involvedMembers.map(m => (
                             <div key={m} className="flex items-center mt-2">
                                <span className="w-1/3">{m}</span>
                                <input type="number" value={unequalAmounts[m]} onChange={e => setUnequalAmounts({...unequalAmounts, [m]: e.target.value})} placeholder="Amount" className="w-2/3 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"/>
                            </div>
                        ))}
                    </div>
                )}
                <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105">Add Expense</button>
            </form>
        </Modal>
    );
};

const AddDirectPaymentModal = ({ members, onAddPayment, onClose }) => {
    const [paidBy, setPaidBy] = useState(members[0]);
    const [paidTo, setPaidTo] = useState(members[1] || members[0]);
    const [amount, setAmount] = useState('');

    const handleAddPayment = (e) => {
        if(e) e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0 || paidBy === paidTo) {
            alert("Please enter a valid amount and ensure payer and receiver are different.");
            return;
        }
        onAddPayment({ description: `${paidBy} paid ${paidTo}`, amount: numAmount, paidBy, paidTo, type: 'direct' });
        onClose();
    };
    
    return (
        <Modal onClose={onClose} title="Add Direct Payment">
            <form onSubmit={handleAddPayment} className="space-y-4 text-gray-800 dark:text-white">
                 <div>
                    <label className="text-gray-500 dark:text-gray-400">From (Payer):</label>
                    <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-green-500">
                        {members.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="text-gray-500 dark:text-gray-400">To (Receiver):</label>
                    <select value={paidTo} onChange={e => setPaidTo(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-green-500">
                        {members.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                 <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"/>
                 <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105">Add Payment</button>
            </form>
        </Modal>
    );
};


const Dashboard = ({ group, expenses, onAddExpense, onBack, theme, setTheme }) => {
    const [activeModal, setActiveModal] = useState(null);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);

    const totalExpense = useMemo(() => {
        return expenses
            .filter(exp => exp.type === 'group')
            .reduce((sum, exp) => sum + exp.amount, 0);
    }, [expenses]);

    const balances = useMemo(() => {
        const currentBalances = group.members.reduce((acc, member) => ({ ...acc, [member]: 0 }), {});
        
        expenses.forEach(expense => {
            if (expense.type === 'group' || expense.type === 'direct') {
                if(currentBalances[expense.paidBy] !== undefined) currentBalances[expense.paidBy] += expense.amount;
                if(expense.type === 'group') {
                    for (const participant in expense.splits) {
                        if(currentBalances[participant] !== undefined) {
                          currentBalances[participant] -= expense.splits[participant];
                        }
                    }
                } else { // direct payment
                    if(currentBalances[expense.paidTo] !== undefined) currentBalances[expense.paidTo] -= expense.amount;
                }
            }
        });
        return currentBalances;
    }, [expenses, group.members]);

    const simplifiedDebts = useMemo(() => {
        const debtors = [];
        const creditors = [];

        for (const person in balances) {
            if (balances[person] < -0.01) {
                debtors.push({ name: person, amount: -balances[person] });
            } else if (balances[person] > 0.01) {
                creditors.push({ name: person, amount: balances[person] });
            }
        }
        
        const transactions = [];
        
        while (debtors.length > 0 && creditors.length > 0) {
            debtors.sort((a,b) => a.amount - b.amount);
            creditors.sort((a,b) => a.amount - b.amount);
            const debtor = debtors[0];
            const creditor = creditors[0];
            const amount = Math.min(debtor.amount, creditor.amount);

            transactions.push({ from: debtor.name, to: creditor.name, amount });

            debtor.amount -= amount;
            creditor.amount -= amount;

            if (debtor.amount < 0.01) debtors.shift();
            if (creditor.amount < 0.01) creditors.shift();
        }

        return transactions;
    }, [balances]);

    const handleMemberAdded = async (name) => {
        const groupDocRef = doc(db, `/artifacts/${appId}/public/data/groups`, group.id);
        await updateDoc(groupDocRef, {
            members: arrayUnion(name)
        });
    };
    
    const handleSettleUp = (debt) => {
        onAddExpense({
            description: `Settlement: ${debt.from} to ${debt.to}`,
            amount: debt.amount,
            paidBy: debt.from,
            paidTo: debt.to,
            type: 'direct'
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex justify-between items-center mb-2">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">{group.name}</h1>
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                </header>
                <div className="flex justify-between items-center mb-8">
                    <button onClick={onBack} className="text-sm text-blue-500 hover:underline">&larr; Back to Groups</button>
                    <button onClick={() => setShowAddMemberModal(true)} className="text-sm text-green-500 hover:underline flex items-center">
                        <UserPlus className="w-4 h-4 mr-1" /> Add Member
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold flex items-center text-gray-600 dark:text-gray-300"><Receipt className="mr-3 text-purple-500"/>Total Group Expense</h3>
                        <p className="text-3xl font-bold mt-2 text-gray-800 dark:text-white">₹{totalExpense.toFixed(2)}</p>
                    </div>
                    <button onClick={() => setActiveModal('groupExpense')} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700 text-left">
                        <h3 className="text-lg font-bold flex items-center"><PlusCircle className="mr-3 text-green-500"/>Add Group Expense</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Split a bill for meals, groceries, etc.</p>
                    </button>
                    <button onClick={() => setActiveModal('directPayment')} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700 text-left">
                        <h3 className="text-lg font-bold flex items-center"><ArrowRight className="mr-3 text-blue-500"/>Add Direct Payment</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Record a payment between members.</p>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold mb-4 flex items-center"><Users className="mr-3"/>Balances</h2>
                        <ul className="space-y-3">
                            {Object.entries(balances).map(([name, balance]) => (
                                <li key={name} className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center">
                                        <UserAvatar name={name} />
                                        <span className="font-medium ml-3">{name}</span>
                                    </div>
                                    <span className={`font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {balance >= 0 ? 'Gets back' : 'Owes'} ₹{Math.abs(balance).toFixed(2)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold mb-4 flex items-center"><IndianRupee className="mr-3"/>Who Owes Whom</h2>
                        {simplifiedDebts.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">All settled up! 🎉</p>
                        ) : (
                            <ul className="space-y-4">
                                {simplifiedDebts.map((debt, i) => (
                                    <li key={i} className="flex items-center flex-wrap justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <div className="flex items-center">
                                            <UserAvatar name={debt.from} />
                                            <span className="font-bold text-red-500 ml-3">{debt.from}</span>
                                            <ArrowRight className="text-gray-500 mx-2 sm:mx-4"/>
                                            <UserAvatar name={debt.to} />
                                            <span className="font-bold text-green-500 ml-3">{debt.to}</span>
                                        </div>
                                        <div className="flex items-center mt-2 sm:mt-0">
                                            <span className="font-mono text-lg mr-4">₹{debt.amount.toFixed(2)}</span>
                                            <button onClick={() => handleSettleUp(debt)} className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors">Settle Up</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 flex items-center"><History className="mr-3"/>Expense History</h2>
                    {expenses.length > 0 ? (
                        <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {expenses.map(exp => (
                                <li key={exp.id} className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <p className="font-bold">{exp.description}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {exp.type === 'group' ? `Paid by ${exp.paidBy}` : `${exp.paidBy} paid ${exp.paidTo}`}
                                            {exp.createdAt && ` on ${exp.createdAt.toDate().toLocaleDateString()}`}
                                        </p>
                                    </div>
                                    <span className={`font-bold text-lg ${exp.type === 'direct' ? 'text-blue-500' : 'text-gray-800 dark:text-white'}`}>₹{exp.amount.toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No expenses recorded yet.</p>
                    )}
                </div>
            </div>

            {activeModal === 'groupExpense' && <AddExpenseModal members={group.members} onAddExpense={onAddExpense} onClose={() => setActiveModal(null)} />}
            {activeModal === 'directPayment' && <AddDirectPaymentModal members={group.members} onAddPayment={onAddExpense} onClose={() => setActiveModal(null)} />}
            {showAddMemberModal && <AddMemberModal group={group} onMemberAdded={handleMemberAdded} onClose={() => setShowAddMemberModal(false)} />}
        </div>
    );
};

export default function App() {
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [groupData, setGroupData] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    useEffect(() => {
        if (!firebaseKeysLoaded) {
            setIsLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, `/artifacts/${appId}/public/data/users`, currentUser.uid);
                const unsubDoc = onSnapshot(userDocRef, (userDoc) => {
                    if (userDoc.exists()) {
                        setUser(currentUser);
                        setUsername(userDoc.data().username);
                        setIsLoading(false);
                    }
                });
                return () => unsubDoc();
            } else {
                setUser(null);
                setUsername('');
                setSelectedGroupId(null);
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (!selectedGroupId || !firebaseKeysLoaded) {
            setGroupData(null);
            setExpenses([]);
            return;
        };
        const groupDocPath = `/artifacts/${appId}/public/data/groups/${selectedGroupId}`;
        
        const unsubGroup = onSnapshot(doc(db, groupDocPath), (doc) => {
            if (doc.exists()) {
                setGroupData({ id: doc.id, ...doc.data() });
            } else {
                setGroupData(null);
                setSelectedGroupId(null);
            }
        });

        const expensesQuery = query(collection(db, `${groupDocPath}/expenses`), orderBy('createdAt', 'desc'));
        const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
            const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(exp => exp.type);
            setExpenses(expensesData);
        });

        return () => {
            unsubGroup();
            unsubExpenses();
        };
    }, [selectedGroupId]);

    const handleAddExpense = async (expenseData) => {
        if (!selectedGroupId) return;
        try {
            const expenseCollectionPath = `/artifacts/${appId}/public/data/groups/${selectedGroupId}/expenses`;
            await addDoc(collection(db, expenseCollectionPath), {
                ...expenseData,
                createdBy: user.uid,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error adding expense:", error);
            alert("Failed to add expense.");
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-gray-900 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
    }

    if (!firebaseKeysLoaded) {
        return (
            <div className="min-h-screen bg-red-100 text-red-800 flex flex-col justify-center items-center p-4 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Configuration Error</h1>
                <p>The Firebase configuration keys are missing.</p>
                <p className="mt-2 text-sm">This app cannot connect to the database. If you are the developer, please ensure your Vercel Environment Variables are set correctly.</p>
            </div>
        );
    }

    if (!user) {
        return <LoginScreen />;
    }



    if (!selectedGroupId || !groupData) {
        return <GroupHub user={{uid: user.uid, username}} onSelectGroup={setSelectedGroupId} theme={theme} setTheme={setTheme} />;
    }

    return <Dashboard group={groupData} expenses={expenses} onAddExpense={handleAddExpense} onBack={() => setSelectedGroupId(null)} theme={theme} setTheme={setTheme} />;
}

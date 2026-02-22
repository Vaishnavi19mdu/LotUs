import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Role } from '../types';

export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: Role,
  skills: string[],
  interests: string[]
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', cred.user.uid), {
    name,
    email,
    role,
    avatar: '',
    bio: '',
    skills,
    interests,
    tags: [],
    createdAt: new Date().toISOString()
  });
  return cred.user;
};

export const logIn = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const logOut = () => signOut(auth);
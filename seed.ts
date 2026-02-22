import { db } from './firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { mockEvents, mockUsers } from './mockData';

export const seedFirestore = async () => {
  try {
    // Seed users
    for (const user of mockUsers) {
      await setDoc(doc(db, 'users', user.id), {
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        skills: user.skills,
        interests: user.interests,
        tags: user.tags
      });
    }

    // Seed events
    for (const event of mockEvents) {
      await setDoc(doc(db, 'events', event.id), {
        name: event.name,
        description: event.description,
        date: event.date,
        venue: event.venue,
        maxTeamSize: event.maxTeamSize,
        capacity: event.capacity,
        registrationDeadline: event.registrationDeadline,
        type: event.type,
        participantsCount: event.participantsCount,
        teamsCount: event.teamsCount,
        registeredUserIds: event.registeredUserIds
      });
    }

    console.log('✅ Firestore seeded successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
};
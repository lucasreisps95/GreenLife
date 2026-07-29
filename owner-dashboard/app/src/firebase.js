import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const config = {
  apiKey: 'AIzaSyCuLwlhWoHkZ982E4n-2o9VQF3oAM7HH0U',
  authDomain: 'greenlife-ad21a.firebaseapp.com',
  projectId: 'greenlife-ad21a',
  storageBucket: 'greenlife-ad21a.firebasestorage.app',
  messagingSenderId: '881448853980',
  appId: '1:881448853980:web:6bf12e9467109b01d36f19'
}

export const db = getFirestore(initializeApp(config))

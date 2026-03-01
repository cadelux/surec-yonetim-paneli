"use client";
import React, { useEffect, useState } from 'react';
import { Training } from '../../../types';
import { FirebaseStorage } from '../../../services/firebaseStorage';
import TrainingEditor from '../../../components/TrainingEditor';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Link from 'next/link';
// ... rest of the file

export default function EditTrainingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const [training, setTraining] = useState<Training | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTraining = async () => {
            try {
                // Find training by partial match on pageUrl or use ID if available
                // Assuming slug might be part of the URL or the ID. 
                // However, our URL structure is /egitim/slug-id
                // Let's try to match by pageUrl first.

                const fullPath = `/egitim/${slug}`;
                // ... rest of logic using 'slug' instead of 'params.slug'

                // Query by pageUrl
                const q = query(
                    collection(db, 'trainings'),
                    where("pageUrl", "==", fullPath)
                );

                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    setTraining({ id: doc.id, ...doc.data() } as Training);
                } else {
                    // Try to fetch by ID if slug is just ID? 
                    // Or maybe we can't easily find it if slug is unique.
                    // Let's assume the slug passed here matches what we generated.
                }
            } catch (error) {
                console.error("Error fetching training:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTraining();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!training) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
                <h1 className="text-2xl font-bold">Eğitim Bulunamadı</h1>
                <Link href="/" className="px-6 py-2 bg-primary text-white rounded-full font-bold">
                    Ana Sayfaya Dön
                </Link>
            </div>
        );
    }

    return (
        <TrainingEditor
            training={training}
            onClose={() => window.location.href = '/'} // Return to dashboard
            onSave={() => {
                // Determine save message or redirect
                if (confirm("Eğitim başarıyla güncellendi. Eğitim sayfasına gitmek ister misiniz?")) {
                    window.location.href = training.pageUrl;
                }
            }}
            onDelete={async () => {
                try {
                    await FirebaseStorage.deleteTraining(training.id);
                    // Alert handled by browser location change usually, but we can add one
                    // alert("Eğitim silindi"); 
                    window.location.href = '/';
                } catch (error) {
                    console.error("Delete error:", error);
                    alert("Silme işlemi başarısız oldu.");
                }
            }}
        />
    );
}

"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Training } from '../../types';
import { ArrowLeft, BookOpen, Clock, Calendar, Share2, PlayCircle, CheckCircle, ChevronRight, ChevronLeft, Target, MessageCircle, Ear, Heart, Users, ShieldAlert, Award, Mic, FileText, XCircle, Zap, Smile } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// --- TRAINING CONTENT DATA ---
const COMMUNICATION_CONTENT = [
    {
        id: 1,
        title: "İletişimin Gücü",
        icon: <MessageCircle size={32} />,
        duration: "5 dk",
        content: `
            <div class="space-y-6">
                <div class="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border-l-4 border-blue-500">
                    <h3 class="text-xl font-bold text-blue-800 dark:text-blue-300 mb-2">İletişim Nedir?</h3>
                    <p class="text-lg leading-relaxed">İletişim, sadece konuşmak değildir. İletişim; duygu, düşünce ve bilgilerin her türlü yolla başkalarına aktarılması ve <strong>anlaşılması</strong> sürecidir.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-surface border border-border p-4 rounded-xl shadow-sm">
                        <div class="text-2xl mb-2">📡</div>
                        <h4 class="font-bold mb-1">Bilgi Aktarımı</h4>
                        <p class="text-sm text-foreground/70">Verilerin ve gerçeklerin paylaşılması.</p>
                    </div>
                    <div class="bg-surface border border-border p-4 rounded-xl shadow-sm">
                        <div class="text-2xl mb-2">❤️</div>
                        <h4 class="font-bold mb-1">Duygu Paylaşımı</h4>
                        <p class="text-sm text-foreground/70">Hissedilenlerin karşı tarafa hissettirilmesi.</p>
                    </div>
                </div>

                <p class="italic text-foreground/60 text-center border-t border-border pt-4">"Cümlelerinizle insanların zihnine, tavırlarınızla gönlüne hitap edersiniz."</p>
            </div>
        `
    },
    {
        id: 2,
        title: "İletişim Süreci ve Ögeleri",
        icon: <Zap size={32} />,
        duration: "6 dk",
        content: `
            <div class="space-y-6">
                <p class="text-lg mb-4">Bir iletişim sürecinin sağlıklı işlemesi için 5 temel ögeye ihtiyaç vardır. Bunlardan biri eksik olursa iletişim kopukluğu yaşanır.</p>
                
                <div class="relative flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-surface/50 rounded-2xl border border-dashed border-border">
                    <div class="text-center p-3 bg-white dark:bg-white/10 rounded-xl shadow-sm w-full md:w-auto">
                        <div class="font-bold text-primary">Gönderici</div>
                        <div class="text-xs text-foreground/50">Kaynak</div>
                    </div>
                    <div class="hidden md:block text-foreground/30">➜</div>
                    <div class="text-center p-3 bg-white dark:bg-white/10 rounded-xl shadow-sm w-full md:w-auto">
                        <div class="font-bold text-indigo-500">Mesaj</div>
                        <div class="text-xs text-foreground/50">İleti</div>
                    </div>
                    <div class="hidden md:block text-foreground/30">➜</div>
                    <div class="text-center p-3 bg-white dark:bg-white/10 rounded-xl shadow-sm w-full md:w-auto">
                        <div class="font-bold text-purple-500">Kanal</div>
                        <div class="text-xs text-foreground/50">Araç</div>
                    </div>
                    <div class="hidden md:block text-foreground/30">➜</div>
                    <div class="text-center p-3 bg-white dark:bg-white/10 rounded-xl shadow-sm w-full md:w-auto">
                        <div class="font-bold text-pink-500">Alıcı</div>
                        <div class="text-xs text-foreground/50">Hedef</div>
                    </div>
                </div>

                <div class="bg-success/10 text-success-700 p-4 rounded-xl flex items-start gap-3">
                    <div class="mt-1 font-bold text-xl">🔄</div>
                    <div>
                        <h4 class="font-bold">Dönüt (Geri Bildirim)</h4>
                        <p class="text-sm opacity-80">Alıcının mesajı aldığını ve anladığını gösteren tepkisidir. Geri bildirim yoksa, iletişim tek yönlü kalır.</p>
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 3,
        title: "İletişim Engelleri",
        icon: <ShieldAlert size={32} />,
        duration: "7 dk",
        content: `
            <div class="space-y-6">
                <h3 class="text-xl font-bold mb-4">Neden Anlaşamıyoruz?</h3>
                <p>İletişim kanallarını tıkayan, mesajın bozulmasına yol açan faktörlere "İletişim Gürültüsü" denir.</p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                        <h4 class="font-bold text-red-600 mb-2 flex items-center gap-2">
                            <XCircle size={16} /> Kişisel Engeller
                        </h4>
                        <ul class="list-disc list-inside text-sm space-y-1 text-foreground/80">
                            <li>Önyargılar ve varsayımlar</li>
                            <li>Duygusal durum (Öfke, stres)</li>
                            <li>Geçmiş deneyimler</li>
                            <li>İlgisizlik</li>
                        </ul>
                    </div>
                    
                    <div class="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                        <h4 class="font-bold text-orange-600 mb-2 flex items-center gap-2">
                            <XCircle size={16} /> Fiziksel & Dilsel Engeller
                        </h4>
                        <ul class="list-disc list-inside text-sm space-y-1 text-foreground/80">
                            <li>Gürültülü ortam</li>
                            <li>Teknik aksaklıklar</li>
                            <li>Jargon kullanımı (Karmaşık terimler)</li>
                            <li>Ses tonu bozuklukları</li>
                        </ul>
                    </div>
                </div>

                <div class="bg-surface p-4 rounded-xl border-l-4 border-yellow-400 italic text-foreground/70">
                    "Ne söylediğin kadar, karşındakinin ne anladığı önemlidir."
                </div>
            </div>
        `
    },
    {
        id: 4,
        title: "Sözsüz İletişim: Beden Dili",
        icon: <Users size={32} />,
        duration: "8 dk",
        content: `
            <div class="space-y-6">
                <h3 class="text-xl font-bold">Albert Mehrabian Kuralı</h3>
                <p>İletişimde verilen mesajın etkisi üzerine yapılan araştırmalar şaşırtıcı bir gerçeği ortaya koyuyor:</p>

                <div class="flex flex-col md:flex-row gap-4 items-end h-48 my-8 px-4">
                    <div class="w-full md:w-1/3 flex flex-col items-center justify-end h-full group">
                        <div class="text-xl font-black text-foreground mb-2">%7</div>
                        <div class="w-full bg-slate-300 dark:bg-slate-700 rounded-t-xl transition-all h-[7%] group-hover:bg-slate-400"></div>
                        <div class="mt-2 font-bold text-sm text-center">Sözcükler</div>
                    </div>
                    <div class="w-full md:w-1/3 flex flex-col items-center justify-end h-full group">
                        <div class="text-xl font-black text-purple-500 mb-2">%38</div>
                        <div class="w-full bg-purple-300 dark:bg-purple-900/50 rounded-t-xl transition-all h-[38%] group-hover:bg-purple-500"></div>
                        <div class="mt-2 font-bold text-sm text-center text-purple-600">Ses Tonu</div>
                    </div>
                    <div class="w-full md:w-1/3 flex flex-col items-center justify-end h-full group">
                        <div class="text-xl font-black text-primary mb-2">%55</div>
                        <div class="w-full bg-primary/40 rounded-t-xl transition-all h-[55%] group-hover:bg-primary"></div>
                        <div class="mt-2 font-bold text-sm text-center text-primary">Beden Dili</div>
                    </div>
                </div>

                <h4 class="font-bold text-lg mb-2">Güçlü Bir Beden Dili İçin:</h4>
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg text-sm flex items-center gap-2">
                        <CheckCircle size={16} class="text-green-600" /> Dik duruş sergileyin.
                    </div>
                    <div class="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg text-sm flex items-center gap-2">
                        <CheckCircle size={16} class="text-green-600" /> Göz teması kurun (Kaçırmayın).
                    </div>
                    <div class="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg text-sm flex items-center gap-2">
                        <CheckCircle size={16} class="text-green-600" /> Ellerinizi saklamayın (Güven verir).
                    </div>
                    <div class="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg text-sm flex items-center gap-2">
                        <CheckCircle size={16} class="text-green-600" /> Hafif tebessüm edin.
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 5,
        title: "Aktif Dinleme Becerisi",
        icon: <Ear size={32} />,
        duration: "7 dk",
        content: `
            <div class="space-y-6">
                <div class="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg">
                    <h3 class="text-2xl font-bold mb-2">Duymak ≠ Dinlemek</h3>
                    <p class="text-white/90">Duymak kulakla, dinlemek zihinle ve kalp ile yapılır. İyi bir yönetici ve arkadaş, her şeyden önce iyi bir dinleyicidir.</p>
                </div>

                <div class="space-y-4">
                    <h4 class="font-bold text-lg border-b border-border pb-2">Aktif Dinleme Teknikleri</h4>
                    
                    <div class="flex gap-4">
                        <div class="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-primary shrink-0">1</div>
                        <div>
                            <h5 class="font-bold">Onaylayıcı Tepkiler Verin</h5>
                            <p class="text-sm text-foreground/70">Başınızı sallayın, "Anlıyorum", "Evet", "Hı-hı" gibi kısa sözlü tepkilerle dinlediğinizi belli edin.</p>
                        </div>
                    </div>

                    <div class="flex gap-4">
                        <div class="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-primary shrink-0">2</div>
                        <div>
                            <h5 class="font-bold">Söz Kesmeyin</h5>
                            <p class="text-sm text-foreground/70">Karşınızdakinin cümlesini bitirmesine izin verin. Cevabınızı hazırlamak yerine, söylenene odaklanın.</p>
                        </div>
                    </div>

                    <div class="flex gap-4">
                        <div class="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-primary shrink-0">3</div>
                        <div>
                            <h5 class="font-bold">Özetleyin (Yansıtma)</h5>
                            <p class="text-sm text-foreground/70">"Doğru mu anladım, şunu demek istediniz..." diyerek duyduklarınızı kendi cümlelerinizle özetleyin.</p>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 6,
        title: "Ben Dili vs. Sen Dili",
        icon: <Mic size={32} />,
        duration: "6 dk",
        content: `
            <div class="space-y-6">
                <p class="text-lg">İlişkileri zedeleyen en büyük hatalardan biri suçlayıcı konuşma tarzıdır. "Sen" dili saldırır, "Ben" dili paylaşır.</p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div class="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border-2 border-red-100 dark:border-red-900/40 relative overflow-hidden">
                        <div class="absolute top-4 right-4 text-6xl opacity-10">🫵</div>
                        <h4 class="text-xl font-black text-red-600 mb-4">SEN DİLİ</h4>
                        <ul class="space-y-3 text-sm font-medium text-red-800 dark:text-red-200">
                            <li>❌ "Beni hiç dinlemiyorsun!"</li>
                            <li>❌ "Yine geç kaldın!"</li>
                            <li>❌ "Çok kabasın."</li>
                        </ul>
                        <div class="mt-4 pt-4 border-t border-red-200 dark:border-red-800/30 text-xs text-red-600 font-bold">
                            SONUÇ: Savunma, Öfke, İnatlaşma.
                        </div>
                    </div>

                    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border-2 border-green-100 dark:border-green-900/40 relative overflow-hidden">
                        <div class="absolute top-4 right-4 text-6xl opacity-10">🙋</div>
                        <h4 class="text-xl font-black text-green-600 mb-4">BEN DİLİ</h4>
                        <ul class="space-y-3 text-sm font-medium text-green-800 dark:text-green-200">
                            <li>✅ "Sözüm kesilince kendimi önemsiz hissediyorum."</li>
                            <li>✅ "Toplantıya geç başlanması beni endişeelendiriyor."</li>
                            <li>✅ "Bu davranış beni üzdü."</li>
                        </ul>
                        <div class="mt-4 pt-4 border-t border-green-200 dark:border-green-800/30 text-xs text-green-600 font-bold">
                            SONUÇ: Empati, Anlaşılma, Çözüm.
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 7,
        title: "Empati Kurma",
        icon: <Heart size={32} />,
        duration: "5 dk",
        content: `
            <div class="space-y-6">
                <h3 class="text-xl font-bold">Başkalarının Ayakkabılarıyla Yürümek</h3>
                <p>Empati, bir başkasının duygularını, içinde bulunduğu durumu ve bakış açısını anlamaya çalışmaktır. Empati, <strong>hak vermek demek değildir</strong>, anlamaktır.</p>

                <div class="bg-surface border border-border rounded-xl p-6">
                    <h4 class="font-bold mb-4 flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold">!</span>
                        Empati Basamakları
                    </h4>
                    
                    <div class="space-y-4 relative pl-4 border-l-2 border-dashed border-border ml-2">
                        <div class="relative">
                            <div class="w-3 h-3 bg-primary rounded-full absolute -left-[23px] top-1.5 ring-4 ring-background"></div>
                            <h5 class="font-bold text-sm">Onun gibi düşünmek</h5>
                            <p class="text-xs text-foreground/60">"Onun yerinde olsaydım ne düşünürdüm?"</p>
                        </div>
                        <div class="relative">
                            <div class="w-3 h-3 bg-primary rounded-full absolute -left-[23px] top-1.5 ring-4 ring-background"></div>
                            <h5 class="font-bold text-sm">Onun gibi hissetmek</h5>
                            <p class="text-xs text-foreground/60">"Bu olay bana yapılsaydı ne hissederdim?"</p>
                        </div>
                        <div class="relative">
                            <div class="w-3 h-3 bg-primary rounded-full absolute -left-[23px] top-1.5 ring-4 ring-background"></div>
                            <h5 class="font-bold text-sm">Anladığını İletmek</h5>
                            <p class="text-xs text-foreground/60">"Şu an hayal kırıklığına uğramış hissediyorsun, anlıyorum."</p>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 8,
        title: "Geri Bildirim Verme (Feedback)",
        icon: <MessageCircle size={32} />,
        duration: "7 dk",
        content: `
            <div class="space-y-6">
                <p class="text-lg">Geri bildirim bir eleştiri değil, bir geliştirme aracıdır. Doğru verilirse kişiyi motive eder ve hatasını düzeltmesini sağlar.</p>

                <div class="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-200 dark:border-amber-800/30">
                    <h3 class="text-xl font-black text-amber-700 dark:text-amber-500 mb-4 text-center">🥪 Sandviç Tekniği</h3>
                    
                    <div class="space-y-4">
                        <div class="bg-white dark:bg-black/20 p-3 rounded-lg border-l-4 border-green-500">
                            <div class="text-xs font-bold text-green-600 uppercase mb-1">1. Katman: Olumlu Giriş</div>
                            <p class="text-sm">"Emre, sunumdaki enerjin ve hazırlığın harikaydı, tebrik ederim."</p>
                        </div>
                        
                        <div class="bg-white dark:bg-black/20 p-3 rounded-lg border-l-4 border-red-500 my-2 shadow-inner">
                            <div class="text-xs font-bold text-red-600 uppercase mb-1">2. Katman: Geliştirilmesi Gereken (Asıl Mesaj)</div>
                            <p class="text-sm">"Ancak, slaytlardaki yazı miktarı biraz fazlaydı, bu da dinleyicinin takibini zorlaştırdı."</p>
                        </div>

                        <div class="bg-white dark:bg-black/20 p-3 rounded-lg border-l-4 border-green-500">
                            <div class="text-xs font-bold text-green-600 uppercase mb-1">3. Katman: Olumlu Kapanış ve Güven</div>
                            <p class="text-sm">"Bunu sadeleştirdiğinde bir sonraki sunumunun kusursuz olacağına eminim."</p>
                        </div>
                    </div>
                </div>

                <div class="text-xs text-center text-foreground/50 font-bold">
                    "Kişiliği değil, davranışı eleştirin."
                </div>
            </div>
        `
    },
    {
        id: 9,
        title: "Uyum ve Aynalama",
        icon: <Smile size={32} />,
        duration: "4 dk",
        content: `
            <div class="space-y-6">
                <h3 class="text-xl font-bold">Bilinçaltı İletişim: Aynalama</h3>
                <p>İnsanlar kendilerine benzeyen insanları sever ve onlara güvenirler. Aynalama (Mirroring), karşınızdaki kişiyle uyum yakalamak için onun beden dilini, tonlamasını veya kelimelerini <em>ince bir şekilde</em> taklit etmektir.</p>

                <div class="grid grid-cols-3 gap-2">
                    <div class="bg-surface p-3 rounded-xl text-center">
                        <div class="text-2xl mb-1">🧘‍♂️</div>
                        <div class="text-xs font-bold">Duruş Aynalaması</div>
                    </div>
                    <div class="bg-surface p-3 rounded-xl text-center">
                        <div class="text-2xl mb-1">🗣️</div>
                        <div class="text-xs font-bold">Ses Tonu Uyumu</div>
                    </div>
                    <div class="bg-surface p-3 rounded-xl text-center">
                        <div class="text-2xl mb-1">🔁</div>
                        <div class="text-xs font-bold">Kelime Tekrarı</div>
                    </div>
                </div>

                <div class="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                    <strong>Dikkat:</strong> Aynalama yaparken doğal olun. Aşırıya kaçmak taklit ediliyor hissi yaratır ve güveni zedeler.
                </div>
            </div>
        `
    },
    {
        id: 10,
        title: "Özet ve Eyleme Geçiş",
        icon: <CheckCircle size={32} />,
        duration: "3 dk",
        content: `
            <div class="space-y-6 text-center">
                <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Award size={40} />
                </div>
                
                <h3 class="text-2xl font-black mb-2">Tebrikler!</h3>
                <p class="text-lg">Etkili İletişim Teknikleri eğitiminin sonuna geldiniz. Artık çantanızda daha güçlü iletişim araçları var.</p>

                <div class="bg-surface border border-border p-6 rounded-2xl text-left">
                    <h4 class="font-bold mb-3 border-b border-border pb-2">Eve Götürülecekler:</h4>
                    <ul class="space-y-2 text-sm">
                        <li class="flex items-center gap-2">✅ İletişim, anlaşılmaktır.</li>
                        <li class="flex items-center gap-2">✅ Önce dinleyin, sonra konuşun.</li>
                        <li class="flex items-center gap-2">✅ Beden diliniz sözlerinizden daha yüksek sesle konuşur.</li>
                        <li class="flex items-center gap-2">✅ "Sen" dili yerine "Ben" dili kullanın.</li>
                    </ul>
                </div>

                <p class="font-medium text-foreground/60 mt-4">Şimdi, öğrendiklerinizi bir sonraki görüşmenizde uygulamanın tam zamanı!</p>
            </div>
        `
    }
];

function TrainingPageContent() {
    const searchParams = useSearchParams();
    const slug = searchParams.get('slug');
    const [training, setTraining] = useState<Training | null>(null);
    const [loading, setLoading] = useState(true);

    // Slide State
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    useEffect(() => {
        const fetchTraining = async () => {
            if (!slug) return;

            const fullPath = `/egitim/${slug}`;

            try {
                const q = query(
                    collection(db, 'trainings'),
                    where("pageUrl", "==", fullPath)
                );

                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    setTraining({ id: doc.id, ...doc.data() } as Training);
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

    // --- CONTENT RESOLUTION LOGIC ---

    // Check for static content based on title (Legacy support)
    const titleLower = training.title.toLocaleLowerCase('tr-TR');
    const isCommunicationTraining = titleLower.includes('iletişim') || titleLower.includes('iletisim') || titleLower.includes('communication') || titleLower.includes('etkili');

    // Prefer DB slides, fallback to static if matches
    const contentToRender = (training.slides && training.slides.length > 0)
        ? training.slides
        : (isCommunicationTraining ? COMMUNICATION_CONTENT : []);

    const hasContent = contentToRender.length > 0;

    // Current Slide Data
    const currentSlide = contentToRender[currentSlideIndex];
    const progress = ((currentSlideIndex + 1) / contentToRender.length) * 100;

    const handleNextSlide = () => {
        if (currentSlideIndex < contentToRender.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };



    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Hero Section */}
            <div className="relative bg-surface border-b border-border">
                <div className="absolute inset-0 bg-primary/5 pattern-grid-lg opacity-20"></div>
                <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-foreground/50 hover:text-primary transition-colors mb-6 font-medium text-sm">
                        <ArrowLeft size={16} />
                        Eğitimlere Dön
                    </Link>

                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 space-y-4">
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                                {training.category}
                            </span>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                                {training.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-foreground/50">
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} />
                                    {new Date(training.createdAt).toLocaleDateString('tr-TR')}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={18} />
                                    <span>~{contentToRender.reduce((acc: any, curr: any) => acc + parseInt(curr.duration || '0'), 0)} Dakika</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Target size={18} />
                                    <span>Orta Seviye</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Card */}
                        {hasContent && (
                            <div className="w-full md:w-auto bg-background/80 backdrop-blur-md border border-border p-5 rounded-2xl shadow-lg min-w-[250px]">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-bold uppercase text-foreground/50">İlerleme Durumu</span>
                                    <span className="text-xl font-black text-primary">%{Math.round(progress)}</span>
                                </div>
                                <div className="w-full h-3 bg-surface rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className="mt-3 text-xs text-foreground/60 font-medium">
                                    {currentSlideIndex + 1} / {contentToRender.length} Bölüm Tamamlandı
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Sidebar / Syllabus */}
                    <div className="lg:col-span-4 space-y-6 hidden lg:block">
                        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm sticky top-8">
                            <div className="p-4 border-b border-border bg-foreground/5">
                                <h3 className="font-bold flex items-center gap-2">
                                    <BookOpen size={18} />
                                    Eğitim İçeriği
                                </h3>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {hasContent ? (
                                    <div className="divide-y divide-border/50">
                                        {contentToRender.map((slide: any, idx: number) => (
                                            <button
                                                key={slide.id}
                                                onClick={() => {
                                                    setCurrentSlideIndex(idx);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className={`w-full text-left p-4 hover:bg-foreground/5 transition-colors flex items-center gap-3
                                                    ${currentSlideIndex === idx ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}
                                                `}
                                            >
                                                <div className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                                                    ${currentSlideIndex === idx ? 'bg-primary text-white' : (idx < currentSlideIndex ? 'bg-success/20 text-success' : 'bg-surface border text-foreground/40')}
                                                `}>
                                                    {idx < currentSlideIndex ? <CheckCircle size={14} /> : idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className={`text-sm font-bold ${currentSlideIndex === idx ? 'text-primary' : 'text-foreground'}`}>
                                                        {slide.title}
                                                    </div>
                                                    <div className="text-xs text-foreground/40 mt-0.5 flex items-center gap-1">
                                                        <Clock size={10} /> {slide.duration}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center opacity-50 text-sm">İçerik Bulunamadı</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Viewport */}
                    <div className="lg:col-span-8">
                        {hasContent && currentSlide ? (
                            <div className="space-y-6">
                                {/* Slide Content Card */}
                                <div className="bg-background border border-border rounded-3xl overflow-hidden shadow-sm min-h-[500px] flex flex-col relative animate-fade-in">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-foreground">
                                        {(currentSlide as any).icon || <BookOpen size={32} />}
                                    </div>

                                    <div className="p-8 md:p-10 flex-1">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-surface to-background border border-border shadow-sm">
                                                <span className="text-xs font-bold uppercase text-foreground/30">Bölüm</span>
                                                <span className="text-2xl font-black text-primary">{(currentSlideIndex + 1).toString().padStart(2, '0')}</span>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                                                    {currentSlide.title}
                                                </h2>
                                            </div>
                                        </div>

                                        <div
                                            className="prose prose-lg prose-slate dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: currentSlide.content }}
                                        />
                                    </div>

                                    {/* Navigation Footer */}
                                    <div className="bg-surface/30 border-t border-border p-6 flex justify-between items-center backdrop-blur-sm">
                                        <button
                                            onClick={handlePrevSlide}
                                            disabled={currentSlideIndex === 0}
                                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all
                                                ${currentSlideIndex === 0
                                                    ? 'opacity-30 cursor-not-allowed'
                                                    : 'hover:bg-foreground/5 active:scale-95'}
                                            `}
                                        >
                                            <ChevronLeft size={20} />
                                            Önceki
                                        </button>

                                        <div className="text-sm font-bold text-foreground/40 hidden md:block">
                                            {currentSlideIndex + 1} / {contentToRender.length}
                                        </div>

                                        <button
                                            onClick={handleNextSlide}
                                            disabled={currentSlideIndex === contentToRender.length - 1}
                                            className={`flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all
                                                ${currentSlideIndex === contentToRender.length - 1
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'hover:shadow-primary/30 active:scale-95'}
                                            `}
                                        >
                                            {currentSlideIndex === contentToRender.length - 1 ? (
                                                <>Tamamlandı <CheckCircle size={20} /></>
                                            ) : (
                                                <>Sonraki <ChevronRight size={20} /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-surface border border-border rounded-2xl p-12 text-center text-foreground/40 border-dashed">
                                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-bold text-foreground mb-2">Eğitim İçeriği Hazırlanıyor</h3>
                                <p className="max-w-md mx-auto">Bu eğitim için henüz içerik yüklenmemiştir. Lütfen daha sonra tekrar kontrol ediniz.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TrainingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
            <TrainingPageContent />
        </Suspense>
    );
}

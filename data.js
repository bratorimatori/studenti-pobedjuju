/* =====================================================================
   PODACI — izvori navedeni u index.html (sekcija "Izvori").
   Sve cifre za 2023. su iz konačnog izveštaja RIK-a (3. januar 2024).
   Cifre označene sa approx:true su izvedene iz zvaničnih procenata RIK-a
   (procenat × 3.815.007 glasalih) jer RIK u saopštenju daje samo procente.
   ===================================================================== */

const ELECTION_DATE = new Date('2026-10-25T07:00:00+02:00');
const LAST_UPDATED = '17. septembar 2026.';

/* ---------- Parlamentarni izbori 17. 12. 2023. — zvanični rezultati ---------- */
const E2023 = {
  registered: 6500666,
  cast: 3815007,      // birača koji su glasali (na ovo se računa cenzus od 3 %)
  valid: 3710978,
  invalid: 104029,
  pollingStations: 8273,
  seats: 250,
  lists: [
    // bloc: 'gov' = vladajući blok 2026 · 'opp' = opozicija · 'min' = manjinska lista
    { id:'sns',  name:'Aleksandar Vučić – Srbija ne sme da stane', short:'SNS lista', votes:1783701, pct:46.75, seats:129, bloc:'gov',
      note:'SNS, SDPS, PS, PUPS, SNP, SPO, NSS, USS, ZS, SL, SSD.' },
    { id:'spn',  name:'Srbija protiv nasilja', short:'SPN', votes:902450, pct:23.66, seats:65, bloc:'opp',
      note:'SSP, NPS, ZLF, DS, Zajedno, SRCE, EU, PSG, NLS, PZP, Sloga… Koalicija se raspala aprila 2024; većina članica danas podržava Studentsku listu, SSP (Đilas) ide sa listom PES.' },
    { id:'sps',  name:'Ivica Dačić – premijer Srbije (SPS–JS–Zeleni)', short:'SPS–JS', votes:249916, pct:6.55, seats:18, bloc:'gov',
      note:'Nije bila na listi sa SNS, ali je posle izbora ušla u Vladu (Dačić je ministar policije). Računa se u vladajući blok.' },
    { id:'nada', name:'NADA – Nova DSS – POKS (Miloš Jovanović)', short:'NADA', votes:191431, pct:5.02, seats:13, bloc:'opp',
      note:'Opozicija; 2026. skuplja potpise samostalno kao „Autentična desnica“.' },
    { id:'mi',   name:'Mi – glas iz naroda (Branimir Nestorović)', short:'MI–GIN', votes:178830, pct:4.69, seats:13, bloc:'opp',
      note:'Nastupali kao opozicija, odbili koaliciju i sa SNS i sa SPN. Pokret se 2024. rascepio; deo poslanika otišao. Tretiran kao opozicija uz ogradu.' },
    { id:'no',   name:'Nacionalno okupljanje (Zavetnici + Dveri)', short:'Zavetnici–Dveri', votes:105165, pct:2.76, seats:0, bloc:'split',
      note:'Ispod cenzusa. Zavetnici su 2024. ušli u Vladu (M. Đurđević Stamenkovski – ministarka), Dveri danas podržavaju Studentsku listu. Podeljeno 50/50.' },
    { id:'svm',  name:'Savez vojvođanskih Mađara – Balint Pastor', short:'SVM', votes:64747, pct:1.70, seats:6, bloc:'min', minGov:true,
      note:'Manjinska lista; tradicionalni partner SNS u Vladi.' },
    { id:'srs',  name:'Srpska radikalna stranka', short:'SRS', votes:55700, pct:1.46, seats:0, bloc:'gov', approx:true,
      note:'Ispod cenzusa 2023. Na izborima 2026. SRS je na listi „Aleksandar Vučić – Ujedinjena Srbija“.' },
    { id:'djs',  name:'Saša Radulović – Boris Tadić – Dobro jutro, Srbijo', short:'Dobro jutro Srbijo', votes:45000, pct:1.18, seats:0, bloc:'opp', approx:true, note:'Ispod cenzusa. Opozicija.' },
    { id:'ns',   name:'Narodna stranka – siguran izbor', short:'Narodna stranka', votes:33600, pct:0.88, seats:0, bloc:'opp', approx:true, note:'Ispod cenzusa. Opozicija.' },
    { id:'spp',  name:'Usame Zukorlić – Ujedinjeni za pravdu (SPP–DSHV)', short:'SPP', votes:29066, pct:0.76, seats:2, bloc:'min', minGov:true, note:'Manjinska lista; SPP u Vladi.' },
    { id:'sdas', name:'SDA Sandžaka – Sulejman Ugljanin', short:'SDAS', votes:21827, pct:0.57, seats:2, bloc:'min', minGov:true, note:'Manjinska lista; po pravilu glasa uz vlast.' },
    { id:'pbasn',name:'Politička borba Albanaca – Šaip Kamberi', short:'Kamberi', votes:13501, pct:0.35, seats:1, bloc:'min', minGov:false, note:'Manjinska lista; glasa uz opoziciju.' },
    { id:'rus',  name:'Ruska stranka – Slobodan Nikolić', short:'Ruska stranka', votes:11369, pct:0.30, seats:1, bloc:'min', minGov:true, note:'Manjinska lista; glasa uz vlast.' },
    { id:'ceda', name:'Lista Čedomira Jovanovića', short:'Čeda Jovanović', votes:9200, pct:0.24, seats:0, bloc:'opp', approx:true, note:'Ispod cenzusa.' },
    { id:'zbr',  name:'Zajedno za budućnost i razvoj', short:'ZBR', votes:6900, pct:0.18, seats:0, bloc:'opp', approx:true, note:'Ispod cenzusa.' },
    { id:'snz',  name:'Srbija na Zapadu – Da se struka pita', short:'Srbija na Zapadu', votes:5300, pct:0.14, seats:0, bloc:'opp', approx:true, note:'Ispod cenzusa.' },
    { id:'ada',  name:'Albanska demokratska alternativa', short:'ADA', votes:3000, pct:0.08, seats:0, bloc:'min', minGov:false, approx:true, note:'Manjinska lista, bez mandata.' },
  ],
};

/* ---------- Istorija: lista oko SNS, glasovi i izlaznost ---------- */
const SNS_HISTORY = [
  { year:2012, votes:940659,  turnout:57.8, note:'SNS prvi put; koalicija „Pokrenimo Srbiju“' },
  { year:2014, votes:1736920, turnout:53.1, note:'' },
  { year:2016, votes:1823147, turnout:56.1, note:'' },
  { year:2020, votes:1953998, turnout:48.9, note:'bojkot opozicije' },
  { year:2022, votes:1635101, turnout:58.5, note:'' },
  { year:2023, votes:1783701, turnout:58.7, note:'' },
];

/* ---------- Istraživanja javnog mnjenja 2026 (procenti među opredeljenima) ---------- */
const POLLS = [
  { pollster:'Faktor plus', date:'2026-09-04', label:'4. sep', n:1200, sns:47.2, sl:31.5, sps:4.9, flag:'Opozicija i nezavisni mediji optužuju agenciju za naklonjenost vlasti; ~33 % neodlučnih.' },
  { pollster:'BIRODI (model)', date:'2026-08-30', label:'30. avg', n:null, sns:38.6, sl:48.5, sps:3.9, model:true, flag:'Nije anketa – statistički model (Monte Karlo) na bazi svih istraživanja i RIK podataka; očekivana izlaznost ≈ 4,13 mil.' },
  { pollster:'Nacija TV', date:'2026-08-03', label:'3. avg', n:1215, sns:44.1, sl:41.6, sps:3.1, flag:'' },
  { pollster:'NSPM', date:'2026-07-30', label:'30. jul', n:1000, sns:37.5, sl:39.6, sps:4.9, flag:'Telefonska anketa; sirovo 27,9 % SNS vs 29,5 % SL.' },
  { pollster:'CRTA / Stanford DAL', date:'2026-07-15', label:'15. jul', n:2324, sns:35.7, sl:44.9, sps:3.8, flag:'Licem u lice, teren 10–24. jun. Prvi put od 2010. da neko drugi vodi u nacionalnoj anketi.' },
  { pollster:'Faktor plus', date:'2026-06-26', label:'26. jun', n:1200, sns:47.1, sl:30.7, sps:5.0, flag:'' },
  { pollster:'Faktor plus', date:'2026-04-30', label:'30. apr', n:1000, sns:46.4, sl:28.7, sps:5.0, flag:'' },
];

/* „Za vlast / protiv vlasti“ – hipotetički dvolistni scenariji */
const BLOC_POLLS = [
  { pollster:'Nacija TV', date:'jul 2026',  gov:48.6, opp:51.4 },
  { pollster:'NSPM',      date:'april 2026', gov:43.6, opp:56.4 },
];

/* ---------- Proglašene liste (RIK, stanje 16. 9. 2026) ---------- */
const LISTS_2026 = [
  { no:1, name:'Aleksandar Vučić – Ujedinjena Srbija', carrier:'Aleksandar Vučić', parties:'SNS, PUPS, USS, NSS, ZS, SSD, SRS, Radnička partija, BOSS, PA', sigs:'209.130', bloc:'gov' },
  { no:2, name:'Ivica Dačić – Faktor stabilnosti!', carrier:'Ivica Dačić', parties:'SPS, JS, SDPS, Zeleni Srbije', sigs:'18.162', bloc:'gov' },
  { no:3, name:'Studentska lista – Studenti pobeđuju', carrier:'Ilija Srdanović (kardiolog, Novi Sad)', parties:'grupa građana; podrška: DS, ZLF, PSG, NPS, NLS, EU, Kreni-Promeni, LSV, Dveri, DJB…', sigs:'69.099', bloc:'opp' },
  { no:4, name:'Rasim Ljajić – Ljudski put', carrier:'Dženan Palamar', parties:'SDP, CDP', sigs:'7.675', bloc:'min' },
  { no:5, name:'Savez vojvođanskih Mađara – Balint Pastor', carrier:'Balint Pastor', parties:'SVM', sigs:'9.332', bloc:'min' },
];
const EXPECTED_LISTS = [
  'Autentična desnica (Novi DSS, Monarhisti) – Miloš Jovanović – skuplja potpise',
  'Platforma za evropsku Srbiju – PES (SSP/Đilas, SRCE) – najavljeno; PSG napustio i podržao studente',
  'Narodna Srbija (NPS, NLS, EU) – povukla se 15. 9. i podržala Studentsku listu',
  'Ostale manjinske liste (SPP, SDAS, Kamberi…) – očekuju se do 4. 10.',
];

const TIMELINE = [
  { date:'1. nov 2024.', text:'Pad nadstrešnice na Železničkoj stanici u Novom Sadu (16 poginulih) – početak studentskih blokada i protesta.' },
  { date:'15. mar 2025.', text:'Najveći protest u istoriji Srbije u Beogradu (300.000+). Studenti traže vanredne izbore.' },
  { date:'16. apr 2025.', text:'Vlada Đure Macuta (nestranačkog) zamenjuje Vučevićevu.' },
  { date:'9. sep 2026.', text:'Vučić raspisuje vanredne parlamentarne izbore; počinje kampanja.' },
  { date:'12–16. sep 2026.', text:'RIK proglašava prvih pet lista. Studentska lista pod rednim brojem 3.' },
  { date:'3. okt 2026.', text:'Rok za prijavu glasanja u inostranstvu (preko DKP).' },
  { date:'4. okt 2026.', text:'Rok za predaju izbornih lista (do ponoći).' },
  { date:'9. okt 2026.', text:'Zaključenje biračkog spiska; RIK objavljuje ukupan broj birača i zbirnu listu.' },
  { date:'22. okt 2026.', text:'Izborna tišina od ponoći.' },
  { date:'25. okt 2026.', text:'DAN IZBORA – biračka mesta otvorena 07–20 h. ODIHR posmatra izbore.' },
];

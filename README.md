# Studenti pobeđuju? — simulator izbora 25. 10. 2026.

Jednostrani, statični sajt (HTML + CSS + vanilla JS, bez zavisnosti) koji modelira
vanredne parlamentarne izbore u Srbiji 25. oktobra 2026.

**Premisa:** lista oko SNS-a dobija isti broj glasova kao 2023. (1.783.701),
Studentska lista preuzima većinu glasova koje je 2023. osvojila opozicija
(SPS se računa u vladajući blok jer je posle izbora ušao u Vladu),
a svaki birač iznad izlaznosti iz 2023. je „novi birač“. Klizač menja broj izašlih
birača; mandati se računaju po D'Ontu sa cenzusom 3 % i koeficijentom 1,35 za
manjinske liste. Sve pretpostavke su podesive u sekciji „Pretpostavke modela“.

## Struktura

- `index.html` — struktura stranice i tekst
- `style.css` — tokeni (svetla/tamna tema), raspored
- `data.js` — zvanični rezultati 2023 (RIK), ankete 2026, proglašene liste, vremenska linija
- `app.js` — model (D'Ont, prelomne tačke) i SVG dijagrami

## Lokalno

```
python3 -m http.server 8765
# http://localhost:8765/
```

## Deploy

Vercel: „Other“ framework, bez build koraka — koren repozitorijuma se servira kao statičan sajt.

## Ažuriranje podataka

Sve cifre su u `data.js` (`E2023`, `POLLS`, `LISTS_2026`, `TIMELINE`, `LAST_UPDATED`).
Ukupan broj birača za 2026. RIK objavljuje 9. oktobra — zameniti `E2023.registered`
tamo gde se koristi za izlaznost, ili dodati posebno polje.

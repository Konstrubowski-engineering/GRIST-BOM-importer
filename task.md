# Task list for Grist BOM Importer

- [x] Zainicjowanie projektu Vite (Vue 3 + TS).
- [x] Stworzenie i skonfigurowanie ładnego, nowoczesnego interfejsu w czystym CSS (zgodnie z "Rich Aesthetics").
- [x] Implementacja odczytywania plików XLSX i CSV za pomocą `xlsx` (SheetJS).
- [x] Algorytm budowania drzewa na podstawie kolumny `Item` (odkrywanie Parent <-> Child).
- [x] Integracja z Grist API:
    - [x] Odczyt aktywnego rekordu, żeby zidentyfikować `Projekt` (jeśli widget jest przypięty do projektu).
    - [x] Pobranie tabel `BOM_CAD` i `BOM_struktura`.
- [x] Algorytm porównujący (Diff):
    - [x] Wykrywanie nowych elementów w `BOM_CAD`.
    - [x] Wykrywanie powiązań w `BOM_struktura` (nowe vs istniejące vs usunięte - soft delete przez `Status_czesci`).
- [x] Wyświetlenie tabeli z drzewem akcji:
    - [x] Hierarchiczne zwijanie i rozwijanie.
    - [x] Logika checkboxów (odznaczenie rodzica -> odznaczenie dzieci).
- [x] Implementacja synchronizacji:
    - [x] Tworzenie/aktualizowanie rekordów w `BOM_CAD`.
    - [x] Odczyt nowych IDs.
    - [x] Tworzenie/aktualizowanie rekordów w `BOM_struktura`.
- [x] Pomyślna kompilacja projektu (Build Vite).

# Plan projektu: Wtyczka Grist do importu BOM z CAD

Celem projektu jest stworzenie niestandardowego widżetu (Custom Widget) dla Grist, który umożliwi importowanie struktur BOM (Bill of Materials) wyeksportowanych z programów CAD (Autodesk Inventor, NX, Solid Edge) w formacie XLSX lub CSV. Wtyczka zaktualizuje bazy danych `BOM-CAD` (biblioteka części) oraz `BOM-struktura` (drzewo struktury).

## Zrozumienie zadania

Zadanie polega na zbudowaniu interfejsu, który:
1. **Wczytuje plik XLSX/CSV** bezpośrednio w przeglądarce.
2. **Rozpoznaje hierarchię (rodzic-dziecko)** na podstawie kolumny `Item` (np. `1` to rodzic dla `1.1` i `1.2`). Na podstawie tej hierarchii odnajdywane są powiązania w kolumnie `Part Number` (zdefiniowanie, jaki Part Number jest rodzicem dla danego elementu).
3. **Analizuje stan obecny w Grist**:
   - Pobiera dane z tabeli `BOM_CAD`, aby sprawdzić, czy dany `Part Number` już istnieje.
   - Pobiera dane z tabeli `BOM_struktura`, aby sprawdzić obecne przypisania i ewentualne różnice (np. zmienione ilości sztuk - QTY).
4. **Generuje widok podglądu (Drzewo)**:
   - Tabela prezentująca operacje do wykonania: stworzenie nowego detalu w `BOM-CAD`, dodanie relacji w `BOM-struktura`, aktualizacja QTY, usunięcie.
   - Struktura zwijana (plus/minus) w widoku drzewa.
   - Checkboxy dla każdego wiersza do decydowania, czy dana pozycja ma zostać zsynchronizowana. Odznaczenie rodzica automatycznie odznacza wszystkie jego dzieci.
5. **Synchronizuje z Grist**:
   - W pierwszej kolejności tworzy brakujące pozycje w `BOM_CAD`.
   - Następnie tworzy lub aktualizuje relacje w `BOM_struktura` z wykorzystaniem prawidłowych numerów ID rekordów z `BOM_CAD` (jako że kolumny referencyjne w Grist wymagają wstawienia Row ID).

## Proponowana technologia

Wtyczka będzie działać jako lokalna/hostowana aplikacja webowa w iframe wewnątrz Grist.

- **Środowisko i budowanie**: Node.js + **Vite** dla błyskawicznego kompilowania i uruchamiania lokalnego serwera deweloperskiego (który podłączymy do Grist).
- **Logika i interfejs (Frontend)**: 
  - **HTML/JS (Vanilla lub lekki framework Vue.js)**. Ze względu na wymóg obsługi reaktywnych checkboxów i zwijanych rzędów drzewa (Parent-Child), użycie lekkiego frameworka jak Vue 3 lub React znacznie uprości zarządzanie stanem odznaczanych elementów i ułatwi stworzenie niesamowitego designu. Proponuję **Vue 3 (Composition API)** + **TypeScript**.
  - **CSS**: Zgodnie z wytycznymi, interfejs musi wyglądać nowocześnie i na poziomie premium. Wykorzystam czysty CSS (Custom Properties, Glassmorphism, płynne animacje zwijania) bez przeładowanych bibliotek typu Tailwind (chyba że wyrazisz zgodę), aby osiągnąć efekt "WOW".
- **Parsowanie plików**: **SheetJS (xlsx)** – standardowa i potężna biblioteka JS do przetwarzania plików `.xlsx` i `.csv` bezpośrednio po stronie klienta (brak konieczności wysyłania pliku na serwer).
- **Integracja z Grist**: Oficjalne **Grist Plugin API** (`grist.docApi` oraz `grist.ready`).

## User Review Required

> [!IMPORTANT]
> **Wybór frameworka UI**: Proponuję wykorzystanie Vue.js do zarządzania stanem drzewa (zaznaczanie/odznaczanie checkboxów u dzieci/rodziców). Czy zgadzasz się na to podejście, czy wolisz czysty (Vanilla) JavaScript?

> [!WARNING]
> **Usuwanie pozycji ze struktury**: Wspomniałeś o usuwaniu pozycji. Czy wtyczka ma usuwać pozycje z `BOM_struktura`, które są w Grist, ale nie ma ich w nowo wgranym pliku XLSX (dla danego głównego złożenia)?

## Open Questions

> [!NOTE]
> 1. Czy struktura pliku XLSX zawsze ma nagłówki na samej górze (pierwszy wiersz), czy mogą być one przesunięte?
> 2. Kiedy tworzymy nowy element w `BOM-CAD`, czy oprócz `Part Number` i `Description` uzupełniamy od razu inne dane w `BOM-CAD` na podstawie pliku XLSX (np. QTY, Material)? Zazwyczaj QTY jest w strukturze, ale plik może posiadać np. nazwę własną.
> 3. Czym kierujemy się do określenia "Głównego Złożenia" (Item 1), do którego wgrywamy ten plik? Czy wtyczka po prostu nadpisze strukturę wszystkich elementów zawartych w pliku Excel niezależnie od tego, co to za projekt?

## Proposed Changes

Cały kod wtyczki będzie znajdował się w nowym katalogu projektu w obrębie folderu roboczego.

### Architektura wtyczki
- Zbudowanie aplikacji webowej w katalogu `grist-bom-plugin`.
- Utworzenie logiki parsującej plik i mapującej `Item` na hierarchię:
  - Kodowanie funkcji rekursywnej budującej drzewo.
  - Kodowanie integracji z Grist (odczyt tabel `BOM_CAD`, `BOM_struktura`).
- Wygenerowanie ładnego interfejsu z listą.
- Akcja synchronizacji wykonująca batche (`grist.docApi.applyUserActions`).

## Verification Plan

### Manual Verification
1. Uruchomię wtyczkę na wbudowanym serwerze deweloperskim Vite.
2. Poproszę Cię o dodanie "Custom Widget" w Twoim dokumencie Grist i wklejenie lokalnego adresu URL.
3. Wczytamy próbny plik `00418-BOM.xlsx` do wtyczki.
4. Zweryfikujemy, czy aplikacja poprawnie rozpoznała drzewo i powiązania (Parent <-> Child).
5. Wykonamy próbny "Sync" odznaczając niektóre detale i sprawdzimy, czy `BOM_CAD` oraz `BOM_struktura` w Grist zostały poprawnie uzupełnione z prawidłowymi referencjami.

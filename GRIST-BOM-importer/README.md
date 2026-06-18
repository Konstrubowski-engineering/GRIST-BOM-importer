# GRIST BOM Importer

Custom widget dla Grist do importowania struktur BOM (Bill of Materials) z plików XLSX i CSV wyeksportowanych z programów CAD (Autodesk Inventor, NX, Solid Edge).

## 🚀 Szybki start

### Hostowanie na GitHub Pages

1. **Sklonuj to repozytorium:**
   ```bash
   git clone https://github.com/twoj-username/GRIST-BOM-importer.git
   cd GRIST-BOM-importer
   ```

2. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

3. **Wypchnij na GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

4. **Włącz GitHub Pages:**
   - Przejdź do **Settings → Pages**
   - Wybierz **GitHub Actions** jako źródło
   - Zapisz

5. **Widget będzie dostępny pod:**
   ```
   https://twoj-username.github.io/GRIST-BOM-importer/
   ```

---

## ⚙️ Instalacja w Grist

1. **Otwórz dokument Grist**
2. **Dodaj widget:**
   - Kliknij **"Customize" → "Add Widget" → "Custom"**
   - Wklej URL widgetu: `https://twoj-username.github.io/GRIST-BOM-importer/`
3. **Skonfiguruj uprawnienia:**
   - **⚠️ WAŻNE:** Ustaw **"Access Level" na "Full Access"**
   - Widget potrzebuje dostępu do tabel: `BOM_CAD`, `BOM_struktura`, `Projekty`
4. **Zapisz i gotowe!**

---

## 📦 Wymagane tabele w Grist

Widget wymaga istnienia następujących tabel w dokumencie Grist:

| Tabela | Opis |
|--------|--------|
| `BOM_CAD` | Biblioteka części (globalna) |
| `BOM_struktura` | Drzewo struktury BOM |
| `Projekty` | Lista projektów |

### Kolumny w `BOM_CAD`:
- `Part_Number` (tekst) - Numer części
- `Description` (tekst) - Opis
- `Stock_Number` (tekst, opcjonalnie)
- `REV` (tekst, opcjonalnie)
- `Material` (tekst, opcjonalnie)
- `Appearance` (tekst, opcjonalnie)
- `Mass` (tekst/liczba, opcjonalnie)
- `Vendor` (tekst, opcjonalnie)
- `Producent` (tekst, opcjonalnie)
- `Projekt` (referencja do tabeli Projekty)

### Kolumny w `BOM_struktura`:
- `Part_Number` (referencja do BOM_CAD)
- `Parent` (referencja do BOM_CAD, opcjonalnie)
- `Item` (tekst) - Numer pozycji (np. 1, 1.1, 1.1.1)
- `QTY` (liczba) - Ilość
- `Status_czesci` (tekst) - Status
- `Projekt` (referencja do tabeli Projekty)

---

## 📄 Obsługiwane formaty plików

- **XLSX** (Excel) - pełne wsparcie
- **CSV** - pełne wsparcie

### Wymagane kolumny w pliku:
- `Item` - Numer pozycji
- `Part Number` - Numer części
- `Description` - Opis

### Opcjonalne kolumny:
- `QTY` / `Quantity` / `Unit QTY` / `Ilość`
- `Stock Number`
- `REV` / `Revision`
- `Material`
- `Appearance`
- `Mass`
- `Vendor`
- `Producent` / `Manufacturer`

---

## 🔧 Rozwiązywanie problemów

### Widget nie ładuje się
- Sprawdź, czy URL jest poprawny (HTTPS)
- Upewnij się, że GitHub Pages jest włączone

### Błąd "Grist API not found"
- Widget nie jest osadzony w Grist
- Otwórz widget **w kontekście dokumentu Grist**

### Błąd "Brak uprawnień"
- **Ustaw "Access Level" na "Full Access"** w ustawieniach widgetu
- Upewnij się, że użytkownik ma uprawnienia do tabel

### Brak listy projektów
- Sprawdź, czy tabela `Projekty` istnieje
- Upewnij się, że widget ma dostęp do tej tabeli

---

## 🛠️ Rozwój lokalny

1. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

2. **Uruchom serwer developerski:**
   ```bash
   npm run dev
   ```

3. **Dodaj widget do lokalnego Grist:**
   - Użyj URL: `http://localhost:5173/`
   - Ustaw Full Access

---

## 📝 Informacje techniczne

- **Framework:** Vue 3 + TypeScript
- **Bundler:** Vite
- **Parsowanie XLSX:** SheetJS (xlsx)
- **Grist API:** grist-plugin-api

---

## 🎨 Zrzuty ekranu

Widget obsługuje:
- Przeciąganie i upuszczanie plików XLSX/CSV
- Walidację danych (brakujące kolumny, duplikaty)
- Podgląd drzewa BOM przed synchronizacją
- Synchronizację zaznaczonych elementów z Grist

---

## 📄 Licencja

MIT

---

## 🙏 Podziękowania

- [Grist](https://www.getgrist.com/) - Platforma do zarządzania danymi
- [SheetJS](https://sheetjs.com/) - Biblioteka do parsowania plików Excel

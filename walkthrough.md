# Grist BOM Importer - Walkthrough

Wtyczka Grist została z powodzeniem zaimplementowana, zbudowana i jest gotowa do testów! 🚀
Kod źródłowy znajduje się w katalogu `e:\Antigravity-code\GRIST-BOM\grist-bom-plugin`.

## Co zostało wykonane

1. **Aplikacja Vue 3 + Vite**: Zbudowano szybką, responsywną aplikację. Wykorzystano nowoczesne praktyki, a pliki skompilowano z powodzeniem bez błędów TypeScriptu.
2. **Nowoczesny interfejs (UI)**:
   - Zaimplementowano strefę **Drag & Drop** do wgrywania plików Excel.
   - Stworzono hierarchiczną, rozwijaną listę (drzewo).
   - Użyto nowoczesnego, ciemnego stylu ("Glassmorphism", odcienie z palety Tailwind).
   - Checkboxy działają w pełni kaskadowo - zaznaczenie/odznaczenie rodzica przenosi się na wszystkie jego dzieci.
3. **Logika i Grist API**:
   - Odczytywanie tabel `BOM_CAD` i `BOM_struktura`.
   - Identyfikowanie ID Projektu z bieżącego rekordu w Grist.
   - Parsowanie pliku za pomocą biblioteki SheetJS, uwzględniając strukturę `1`, `1.1`, `1.1.2`, na podstawie pierwszej linii nagłówków.
   - Synchronizacja brakujących rekordów z Grist wykorzystująca `BulkAddRecord` i `BulkUpdateRecord` dla optymalizacji i prędkości.
   - Mechanizm „Miękkiego usuwania” (Soft Delete) - wykrywa usunięte dzieci (status „Usunięty”) w Grist i prezentuje jako opcja do wylistowania lub ukrycia, przy zachowaniu braku kolizji z innymi projektami.

## Jak uruchomić i przetestować w Grist

Uruchom serwer testowy bezpośrednio w konsoli (Powershell lub CMD) wpisując polecenie z poziomu folderu projektu:

```bash
cd E:\Antigravity-code\GRIST-BOM\grist-bom-plugin
npm run dev
```

Serwer uruchomi się zazwyczaj pod adresem `http://localhost:5173`. 
Następnie:
1. Przejdź do swojego dokumentu Grist w przeglądarce.
2. Dodaj nowy widżet: Opcje ekranu -> Dodaj nowy -> Niestandardowy Widżet (Custom Widget).
3. W jego konfiguracji wprowadź adres URL z uruchomionego serwera dev: `http://localhost:5173`.
4. Upewnij się, że widżet posiada odpowiednie uprawnienia zapisu ("Full Access") w ustawieniach widżetu. W razie potrzeby zlinkuj widżet jako "Selected by" do tabeli przechowującej bazowy rekord Projektu.
5. Wgraj plik `00418-BOM.xlsx` do interfejsu przeciągając go i upuszczając.
6. Przejrzyj drzewko zmian, zweryfikuj różnice i kliknij **Synchronizuj zaznaczone z Grist**. 

Oczekiwane zachowanie to pojawienie się wpisów w tabeli `BOM_CAD` i zbudowanie drzewa struktury w `BOM_struktura` z odpowiednimi referencjami Row ID.

# Kartcis Frame (photobooth web)

Pengganti "filter Instagram" untuk Kartcis. Meta menutup Meta Spark sejak 14 Januari 2025, jadi brand tidak bisa lagi membuat filter AR sendiri di Instagram.

Halaman web ini membuka kamera HP dan menampilkan frame Kartcis langsung di atas kamera. Hasil fotonya (1080×1920, ukuran story) bisa langsung **dibagikan ke Instagram Story** lewat menu share HP, atau disimpan ke galeri.

## Isi

| Frame | Isi |
|---|---|
| **Kartcis** | Bingkai magenta, logo KARTCIS!, Kaci melambai, tulisan "Aku nonton pakai Kartcis!", dan kartcis.id |
| **Tiket** | Foto jadi bagian tiket: tulisan ADMIT ONE, logo, QR hiasan, dan Kaci di atas tiket |
| **Gas Nonton** | Foto penuh layar dengan tulisan "GAS NONTON!", Nonik, Mas Cis, Kaci, dan confetti |

Fitur halaman:
- kamera depan/belakang;
- timer 3 detik;
- pilih foto dari galeri (kalau kamera ditolak atau tidak ada);
- tombol **Bagikan ke Story**, **Simpan**, dan **Ulangi**.

**Privasi:** foto diproses di HP pengguna dan tidak diunggah ke mana pun. Halaman ini tidak punya server atau database.

## Cara memasang (hosting)

1. Upload seluruh isi folder ini (`index.html`, `app.js`, `frames.js`, `chars\`, `assets\`) ke hosting statis apa saja, misalnya:
   - `kartcis.id/frame`;
   - subdomain seperti `frame.kartcis.id`;
   - Cloudflare Pages atau Hostinger.
2. **Wajib HTTPS.** Browser hanya mengizinkan kamera di halaman HTTPS (atau localhost saat uji).
3. Bagikan link-nya lewat bio Instagram, QR di venue, atau story Kartcis: "Foto pakai frame Kartcis di …".

Folder `tools\`, `artifact\`, `contoh\`, dan `out\` hanya untuk pengujian atau contoh, tidak perlu diupload.

`.htaccess` (untuk Hostinger/Apache/LiteSpeed):
- Kalau seluruh repo ikut ter-deploy (misalnya lewat Git di hPanel), file ini memblokir folder uji dan contoh, `README.md`, serta file tersembunyi seperti `.git`. Semuanya dijawab 403.
- File ini juga mematikan daftar isi folder.
- `/.well-known/` tetap terbuka supaya SSL gratis bisa terpasang.
- Kalau upload manual lewat File Manager, ikutkan juga file `.htaccess` ini. File ini tersembunyi, jadi aktifkan "show hidden files".

## Cara pakai (untuk penonton)

1. Buka link, izinkan kamera.
2. Pilih frame (Kartcis / Tiket / Gas Nonton), lalu tekan tombol bulat.
3. Tekan **Bagikan ke Story**, pilih **Instagram**, lalu **Story**.
4. Kalau Instagram tidak muncul di menu share, tekan **Simpan**, lalu upload foto itu dari galeri ke story.

Browser yang didukung: Chrome Android dan Safari iOS versi terbaru (kamera + Web Share).

## Menambah atau mengubah frame

- **Desain frame** ada di `frames.js`:
  - tiap frame punya `win`, yaitu jendela foto (x, y, lebar, tinggi, radius);
  - dan fungsi `draw` untuk hiasannya.
- **Karakter** memakai rig yang sama dengan video (`chars\characters.js`): `build('bunny', 'melambai', 'ketawa')` lalu `paint(...)`.
- **Area aman story:** jangan menaruh teks penting di 250 px teratas dan terbawah (tertutup UI Instagram).

## Link uji (claude.ai Artifact)

Versi uji satu file untuk dicoba di HP: https://claude.ai/artifact/NuBHknx1jY3xGutG4bHG4g (privat, hanya akun pemilik).

Di link ini:
- Kamera live dan Web Share **tidak tersedia**, karena viewer Artifact memblokirnya.
- Tombol **Ambil foto** membuka aplikasi kamera HP lewat `<input capture>`. Tombol **Galeri** membuka galeri.
- Foto bisa digeser dan di-zoom, lalu **Simpan** lewat kemampuan `downloads`.

Cara membangun ulang:
- Sumbernya `artifact/shell.html` dan `artifact/app.js`.
- Frame dan karakter diambil dari `frames.js` dan `chars/`.

```
node tools/build-artifact.mjs                  # -> out/kartcis-frame-uji.html
node tools/test-artifact.mjs <foto.jpg>        # uji headless, screenshot out/uji-*.png
```

Setelah build, publikasikan ulang file `out/kartcis-frame-uji.html` ke URL yang sama.

## Pengujian

```
node tools/test.mjs
```

Skrip ini membuka halaman di Chrome headless dengan kamera palsu dan viewport HP (390×844), lalu:
- memotret tampilan live dan layar hasil;
- mengekspor ketiga frame ke `out\`;
- mengecek bahwa jendela foto benar-benar berisi gambar kamera.

Catatan dari pengujian:
- **Elemen video harus ada di halaman dan "terlihat"** (diletakkan di belakang kanvas). Video yang tidak terpasang tidak mengirim frame di iOS Safari maupun Chrome headless. Video yang tak terlihat dijeda oleh browser.
- **Pelubang jendela harus memakai warna padat.** Dengan `destination-out`, yang terhapus hanya sebesar alpha warna fill-nya.

/**
 * ============================================================================
 * BLINDSPOT — FLOOR 3 EXPANSION, RED-EYED SHADOW ENTITY & MAINTENANCE 3B MODULE
 * File: ./floorThreeExpansion.js
 * ============================================================================
 * Mencakup:
 * 1. Rombakan Visual Entitas: Siluet bayangan hitam pekat murni (0x010101,
 *    roughness: 1.0, metalness: 0.0, menyerap cahaya) dengan vertex animation
 *    bergelombang halus menyerupai asap padat + sepasang mata merah menyala
 *    tajam (2 Sphere MeshBasicMaterial 0xff0000 + PointLight #ff0000, intensitas 1.8,
 *    jarak 2.5m). Berpindah posisi/sudut saat berkedip [Spacebar] diiringi
 *    sfx_entity_breathing_dark.mp3.
 * 2. Revisi Kunci Kamar 304 menjadi Kunci "Ruang Panel 3B / Maintenance 3B"
 *    (hasMaintenanceKey = true) + monolog maya_examine_key_fix.mp3 (10000ms,
 *    isMayaSpeaking = true) + objektif baru.
 * 3. Kemunculan Mata Merah di Koridor Luar saat keluar Kamar 304:
 *    Lampu darurat lobi padam berderak, sepasang mata merah muncul di dekat lift,
 *    putar sfx_red_eyes_appear.mp3 + monolog maya_spot_red_eyes.mp3 (12000ms,
 *    isMayaSpeaking = true).
 * 4. Pintu Ruang Panel 3B ("MAINTENANCE 3B - AUTHORIZED PERSONNEL ONLY") di dinding
 *    lobi seberang lift dengan collider terkunci yang hanya merespons [E] jika
 *    hasMaintenanceKey === true.
 * ============================================================================
 */
(function (window) {
  'use strict';
  window.Blindspot = window.Blindspot || {};

  /**
   * Factory Wujud Baru Entitas:
   * - Tubuh bayangan hitam pekat murni (color: 0x010101, roughness: 1.0, metalness: 0.0)
   *   tanpa detail wajah/mulut/baju, menyerap sorotan senter.
   * - Dilengkapi data vertex asli untuk animasi gelombang asap padat (wavy vertex animation).
   * - Kepala hanya memiliki sepasang mata merah menyala tajam (2 Sphere 0xff0000 + PointLight 1.8, 2.5m).
   */
  function createShadowRedEyesEntity(THREE) {
    const entityGroup = new THREE.Group();

    const pureShadowMat = new THREE.MeshStandardMaterial({
      color: 0x010101,
      roughness: 1.0,
      metalness: 0.0
    });

    // Geometri siluet asap padat bersegmen rapat untuk vertex wave animation
    const smokeBodyGeo = new THREE.CylinderGeometry(0.15, 0.36, 2.22, 20, 28);
    const posAttr = smokeBodyGeo.attributes.position;
    const basePositions = new Float32Array(posAttr.array.length);
    basePositions.set(posAttr.array);
    smokeBodyGeo.userData.basePositions = basePositions;

    const smokeBodyMesh = new THREE.Mesh(smokeBodyGeo, pureShadowMat);
    smokeBodyMesh.position.set(0, 1.11, 0);
    entityGroup.add(smokeBodyMesh);

    // Bagian kepala menyatu hitam pekat tanpa wajah/mulut
    const shadowHeadGeo = new THREE.SphereGeometry(0.19, 18, 18);
    shadowHeadGeo.scale(0.88, 1.28, 0.92);
    const shadowHeadMesh = new THREE.Mesh(shadowHeadGeo, pureShadowMat);
    shadowHeadMesh.position.set(0, 2.05, 0);
    entityGroup.add(shadowHeadMesh);

    // Sepasang Mata Merah Menyala Tajam (2 Sphere kecil MeshBasicMaterial 0xff0000)
    const redEyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eyeGeo = new THREE.SphereGeometry(0.022, 12, 12);

    const leftEye = new THREE.Mesh(eyeGeo, redEyeMat);
    leftEye.position.set(-0.055, 2.06, 0.165);
    entityGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, redEyeMat);
    rightEye.position.set(0.055, 2.06, 0.165);
    entityGroup.add(rightEye);

    // PointLight merah kecil (#ff0000, intensitas 1.8, distance 2.5m) tepat di posisi mata
    const eyePointLight = new THREE.PointLight(0xff0000, 1.8, 2.5, 1.6);
    eyePointLight.position.set(0, 2.06, 0.22);
    entityGroup.add(eyePointLight);

    entityGroup.userData = {
      smokeBodyGeo,
      eyePointLight,
      leftEye,
      rightEye
    };

    return entityGroup;
  }

  /**
   * Vertex Animation bergelombang halus menyerupai asap padat pada tubuh entitas
   */
  function updateShadowEntityVertices(entityGroup, elapsed) {
    if (!entityGroup || !entityGroup.visible || !entityGroup.userData.smokeBodyGeo) return;
    const geo = entityGroup.userData.smokeBodyGeo;
    const posAttr = geo.attributes.position;
    const base = geo.userData.basePositions;
    if (!base) return;

    for (let i = 0; i < posAttr.count; i++) {
      const ix = i * 3;
      const bx = base[ix];
      const by = base[ix + 1];
      const bz = base[ix + 2];

      // Gelombang asap padat halus sepanjang ketinggian siluet
      const waveX = Math.sin(by * 4.2 + elapsed * 3.4 + bz * 5.0) * 0.032;
      const waveZ = Math.cos(by * 3.8 - elapsed * 2.9 + bx * 5.0) * 0.032;

      posAttr.array[ix] = bx + waveX;
      posAttr.array[ix + 1] = by;
      posAttr.array[ix + 2] = bz + waveZ;
    }
    posAttr.needsUpdate = true;
  }

  /**
   * Data Sekuens Dialog Percakapan Radio Maya & Dhafir di Lantai 1 (Area Staf)
   * Seluruh subtitle menggunakan Bahasa Indonesia dengan durasi presisi.
   */
  const DHAFIR_MAYA_RADIO_SEQUENCE = Object.freeze([
    {
      stepId: 'a',
      chimeSfx: 'assets/audio/sfx_radio_click_chime.mp3',
      file: 'assets/audio/dhafir_radio_first_contact.mp3',
      duration: 11000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Kamu yang barusan membanting pintu tangga darurat di Lantai Dua? Ambil radionya kalau kamu masih mau keluar dari sini hidup-hidup. Panggil aku Dhafir.'"
    },
    {
      stepId: 'b',
      chimeSfx: 'assets/audio/sfx_radio_click_chime.mp3',
      file: 'assets/audio/maya_radio_reply.mp3',
      duration: 5000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Siapa kamu?! Kamu sembunyi di mana? Sebenarnya makhluk apa yang ada di luar sana?!'"
    },
    {
      stepId: 'c',
      chimeSfx: 'assets/audio/sfx_radio_click_chime.mp3',
      file: 'assets/audio/dhafir_radio_warning.mp3',
      duration: 11000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Kecilkan suaramu. Dia bisa mendengar segalanya. Lobi utama terkunci rapat dan dia mengincar area terbuka. Ikuti arahanku lewat lorong staf.'"
    },
    {
      stepId: 'd',
      chimeSfx: 'assets/audio/sfx_radio_click_chime.mp3',
      file: 'assets/audio/maya_radio_acknowledge.mp3',
      duration: 10000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Baiklah... aku dengarkan. Beritahu saja bagaimana cara membuka pintu geser utama itu.'"
    }
  ]);

  /**
   * Data Rangkaian Dialog Radio Presisi 7 Babak di Ruang Arsip Darurat (The Panic Archive)
   * Seluruh file audio dipanggil dari assets/audio/ dan seluruh subtitle menggunakan Bahasa Indonesia.
   */
  const PANIC_ARCHIVE_RADIO_SEQUENCE = Object.freeze([
    // Babak 1: Panik & Penstabilan
    {
      chapter: 1,
      playChime: true,
      file: 'assets/audio/maya_trapped_01.mp3',
      duration: 9000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Tidak, tidak, tidak! Sialan, buka! Dhafir?! Pintunya mengunci otomatis dari luar! Aku tidak bisa membukanya!'"
    },
    {
      chapter: 1,
      playChime: true,
      file: 'assets/audio/dhafir_calm_01.mp3',
      duration: 10000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Berhenti memukulnya, Maya. Bahumu cuma akan memar. Itu pintu kebakaran berlapis baja. Mengunci otomatis saat sub-generator me-reset.'"
    },
    {
      chapter: 1,
      playChime: true,
      file: 'assets/audio/maya_trapped_02.mp3',
      duration: 8000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Bagaimana bisa kamu setenang ini?! Aku terjebak di dalam kotak! Kalau makhluk itu merayap lewat ventilasi, aku tidak punya tempat lari lagi!'"
    },
    {
      chapter: 1,
      playChime: true,
      file: 'assets/audio/dhafir_calm_02.mp3',
      duration: 14000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Lihat sekelilingmu. Busa peredam suara tebal, dinding baja lapis ganda. Ruangan itu dibangun sebagai arsip darurat. Meredam semua suara dan panas tubuh. Kamu tidak terlihat di dalam sana. Tarik napas.'"
    },

    // Babak 2: Pengungkapan Agen & Proyek Blindspot
    {
      chapter: 2,
      playChime: true,
      file: 'assets/audio/maya_investigate_01.mp3',
      duration: 13000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Hah... baiklah. Aku bernapas. Tapi jangan mengelak lagi. Siapa kamu sebenarnya, Dhafir? Kamu tahu denah gedung, kamu paham indra makhluk itu... siapa kamu?'"
    },
    {
      chapter: 2,
      playChime: true,
      file: 'assets/audio/dhafir_reveal_01.mp3',
      duration: 13000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Aku bertugas di bawah divisi taktis khusus. Pengintaian operasi tertutup. Dua puluh lima menit lalu, sensor kami menangkap robekan elektromagnetik besar berpusat di kompleks ini.'"
    },
    {
      chapter: 2,
      playChime: true,
      file: 'assets/audio/maya_investigate_02.mp3',
      duration: 9000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Robekan elektromagnetik? Sebenarnya apa yang dibuat di ruang bawah tanah ini? Senjata? Makhluk apa sebenarnya monster bermata merah menyala itu?!'"
    },
    {
      chapter: 2,
      playChime: true,
      file: 'assets/audio/dhafir_reveal_02.mp3',
      duration: 16000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Proyek Blindspot. Itu bukan alien atau hewan, Maya. Itu konstruk saraf biomekanik sintetis. Menargetkan persepsi visual manusia. Saat kamu menatap matanya, dia mengunci sinapsis sarafmu dan memburumu.'"
    },

    // Babak 3: Konspirasi & Pengkhianatan Mark
    {
      chapter: 3,
      playChime: true,
      file: 'assets/audio/maya_mark_01.mp3',
      duration: 10000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Senjata saraf... tunggu, Mark bekerja di bidang arsitektur jaringan saraf di sini. Apa Mark tahu soal ini?! Katakan padaku dia tidak ada hubungannya dengan semua ini!'"
    },
    {
      chapter: 3,
      playChime: true,
      file: 'assets/audio/dhafir_mark_reveal_01.mp3',
      duration: 14000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Aku mengakses server keamanan utama sebelum turun ke lantai bawah. Kebocoran isolasi bukan kerusakan teknis. Segel magnetiknya dibuka manual menggunakan kartu akses utama milik Dr. Mark Evans.'"
    },
    {
      chapter: 3,
      playChime: true,
      file: 'assets/audio/maya_mark_breakdown_01.mp3',
      duration: 11000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Tidak... jangan bohong padaku! Mark yang menelepon ponselku di lantai tiga! Suaranya terdengar panik... dia menyuruhku keluar, dia bilang dia mau menyelamatkanku!'"
    },
    {
      chapter: 3,
      playChime: true,
      file: 'assets/audio/dhafir_mark_reveal_02.mp3',
      duration: 20000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Dengarkan aku, Maya! Makhluk itu sebelumnya tidur. Butuh pikiran manusia yang aktif dan tertekan untuk mengkalibrasi sensor berburunya sebelum pihak pembeli datang. Mark meneleponmu untuk memastikan kamu bangun, bergerak, dan memicu aktivitas otak. Kamu cuma umpan untuk menguji prototipenya.'"
    },
    {
      chapter: 3,
      playChime: true,
      file: 'assets/audio/maya_mark_breakdown_02.mp3',
      duration: 14000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Selama berbulan-bulan... dia tersenyum padaku, membuatkan kopi untukku... dan ternyata selama ini, aku cuma tikus laboratorium yang menunggu dibantai. Bagaimana bisa seseorang sejahat itu...?'"
    },

    // Babak 4: Sisi Personal & Alasan Dhafir Bertindak Sendiri
    {
      chapter: 4,
      playChime: true,
      file: 'assets/audio/dhafir_comfort_01.mp3',
      duration: 14000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Keserakahan mengikis kemanusiaan lebih cepat daripada peluru. Jangan buang air matamu untuk orang yang menukar nyawamu dengan uang. Kamu masih bernapas. Kamu selamat di saat seluruh regu keamanan tewas.'"
    },
    {
      chapter: 4,
      playChime: true,
      file: 'assets/audio/maya_personal_01.mp3',
      duration: 8000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Kenapa kamu masuk sendirian, Dhafir? Kalau tim evakuasimu sedang menuju kemari, kenapa kamu tidak menunggu di luar saja bersama tim perimeter?'"
    },
    {
      chapter: 4,
      playChime: true,
      file: 'assets/audio/dhafir_personal_02.mp3',
      duration: 22000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Protokol memang menyuruh menunggu. Prosedur standar meminta pembakaran total dengan amunisi pembakar untuk meratakan gedung. Tapi tiga tahun lalu... dalam misi di luar negeri, aku ragu, mengikuti protokol, dan meninggalkan warga sipil terjebak di balik reruntuhan. Aku bersumpah tidak akan membiarkan birokrasi mengorbankan nyawa orang tak bersalah lagi.'"
    },
    {
      chapter: 4,
      playChime: true,
      file: 'assets/audio/maya_personal_02.mp3',
      duration: 10000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Jadi kamu melanggar perintah... hanya karena melihat tanda panas tubuhku yang terseok-seok menembus lantai yang banjir?'"
    },
    {
      chapter: 4,
      playChime: true,
      file: 'assets/audio/dhafir_personal_03.mp3',
      duration: 16000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Aku mendengar seorang pejuang lewat radio. Seseorang yang merayap menembus pecahan kaca, menghindari sengatan listrik, dan menolak untuk menyerah. Kamu layak bertahan hidup, Maya. Aku di sini hanya untuk menyeimbangkan keadaan.'"
    },

    // Babak 5: Dinamika Kedekatan Emosional
    {
      chapter: 5,
      playChime: true,
      file: 'assets/audio/maya_feeling_01.mp3',
      duration: 19000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Kamu tahu... seumur hidupku, orang-orang selalu bilang aku terlalu keras kepala, terlalu mandiri. Tapi berdiri di ruangan gelap ini... mendengar suaramu dari radio kecil ini... aku tidak pernah merasa seaman ini.'"
    },
    {
      chapter: 5,
      playChime: true,
      file: 'assets/audio/dhafir_feeling_02.mp3',
      duration: 8000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Kamu lebih tangguh dari dugaanmu. Tapi orang paling tangguh sekalipun butuh seseorang untuk menjaga titik buta mereka. Untuk itulah aku di sini.'"
    },
    {
      chapter: 5,
      playChime: true,
      file: 'assets/audio/maya_feeling_03.mp3',
      duration: 15000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Saat semua ini berakhir... saat matahari terbit dan timmu tiba... apa kamu akan pergi begitu saja seperti hantu? Atau aku bisa mentraktirmu kopi yang sebenarnya tidak layak dinikmati Mark?'"
    },
    {
      chapter: 5,
      playChime: true,
      file: 'assets/audio/dhafir_feeling_04.mp3',
      duration: 14000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Secangkir kopi hitam di luar zona pertempuran terdengar seperti surga. Aku tidak akan menghilang meninggalkanmu, Maya. Aku akan menunggumu di posko medis. Simpan radio itu di sakumu, ya?'"
    },
    {
      chapter: 5,
      playChime: true,
      file: 'assets/audio/maya_feeling_05.mp3',
      duration: 8000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Aku tidak akan melepaskannya. Janji padaku kamu tidak akan terluka, Dhafir.'"
    },

    // Babak 6: Taktik Penetrasi Pintu
    {
      chapter: 6,
      playChime: true,
      file: 'assets/audio/dhafir_prep_01.mp3',
      duration: 15000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Aku berjanji. Sekarang dengarkan baik-baik: Aku sudah sampai di lorong luar ruang arsipmu. Kunci elektroniknya hangus, tapi engsel hidrolik cadangannya terekspos.'"
    },
    {
      chapter: 6,
      playChime: true,
      file: 'assets/audio/maya_prep_02.mp3',
      duration: 6000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Kamu tepat di luar?! Kamu bisa memotong rangkanya?'"
    },
    {
      chapter: 6,
      playChime: true,
      file: 'assets/audio/dhafir_prep_03.mp3',
      duration: 13000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Tidak ada waktu untuk las pemotong. Aku memasang peluru penembus baja. Pindah ke sudut belakang ruangan, di balik lemari arsip tebal. Tutup kepala dan telingamu!'",
      objectiveOnStart: 'Berlindung di sudut belakang ruangan di balik lemari arsip tebal!'
    },
    {
      chapter: 6,
      playChime: true,
      file: 'assets/audio/maya_prep_04.mp3',
      duration: 5000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Aku sudah di posisi! Lakukan!'",
      triggerBreachAfter: true
    }
  ]);

  const PANIC_ARCHIVE_POST_BREACH_SEQUENCE = Object.freeze([
    // Babak 7: Tembakan Pintu & Dorongan Terakhir ke Lobi
    {
      chapter: 7,
      playChime: false,
      file: 'assets/audio/maya_cough_smoke.mp3',
      duration: 11000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Uhuk... uhuk... engselnya copot hancur! Dhafir?! Kamu di mana?!'"
    },
    {
      chapter: 7,
      playChime: true,
      file: 'assets/audio/dhafir_final_push.mp3',
      duration: 16000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Jangan cari aku, Maya! Aku menahan titik buta belakang! Suara tembakan tadi memancing makhluk itu—dia turun dari plafon atrium! Lari menembus pintu lobi sekarang juga! Jangan lihat ke atas plafon, terus lari!'"
    },
    {
      chapter: 7,
      playChime: true,
      file: 'assets/audio/maya_final_sprint.mp3',
      duration: 10000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Aku lari! Sampai ketemu saat fajar terbit, Dhafir!'"
    }
  ]);

  class FloorThreeExpansion {
    constructor(gameScene) {
      this.game = gameScene;
      this.scene = gameScene ? gameScene.scene : null;
      if (gameScene && !Array.isArray(gameScene.interactables)) {
        gameScene.interactables = [];
      }
      this.interactables = (gameScene && gameScene.interactables) ? gameScene.interactables : [];

      // Pencahayaan Lobby & Luar Jendela
      this.lobbyNeonLight = null;
      this.lobbyNeonMat = null;
      this.lobbyEmergencyLights = [];
      this.skyFlashLight = null;
      this.skyFlashTimer = 0;
      this.nextSkyFlashIn = 4.2;
      this.elevatorErrorLight = null;
      this.elevatorButtonMat = null;
      this.elevatorSparkLight = null;

      // Mekanik Gorden Jendela Dua Tahap
      this.curtainLeft = null;
      this.curtainRight = null;
      this.areCurtainsOpen = false;
      this.isCurtainAnimating = false;
      this.curtainAnimStart = 0;
      this.curtainAnimDuration = 0.8;

      // Kamar 304 (5m x 4m) & Kunci Ruang Panel 3B (Maintenance 3B)
      this.room304DoorPivot = null;
      this.isRoom304Open = true;
      this.isRoom304TrapLocked = false;
      this.isRoom304Animating = false;
      this.room304AnimStart = 0;
      this.room304AnimDuration = 1.2;
      this.room304TargetAngle = 0.62;

      this.hasEnteredRoom304 = false;
      this.hasMaintenanceKey = false;
      this.hasStairwellKey = false;
      this.stairwellKeyMesh = null;
      this.keyGlintPoints = null;
      this.keyGlintMat = null;

      // Entitas Kamar 304 & Koridor Luar (Shadow with Glowing Red Eyes)
      this.roomEntityMesh = null;
      this.roomEntityHeadWorldPos = null;
      this.isRoom304EntityActive = false;
      this.isLookingAtRoomEntity = false;
      this.room304BlinkCount = 0;
      this.staticBuzzOsc = null;
      this.staticBuzzGain = null;

      // Event Mata Merah di Koridor Luar (Pasca Keluar Kamar 304)
      this.corridorRedEyesEntity = null;
      this.hasTriggeredCorridorRedEyes = false;
      this.isCorridorRedEyesActive = false;

      // Pintu & Interior Ruang Panel 3B (6m x 5m) + CCTV + Basement Generator (12m x 10m)
      this.maintenance3BDoorPivot = null;
      this.isMaintenance3BOpen = false;
      this.isMaintenance3BAnimating = false;
      this.maintenance3BAnimStart = 0;
      this.hasEnteredMaintenance3B = false;

      // Sistem Monitor CCTV Interaktif (3 CRT Monitors + Foreshadowing Scare)
      this.cctvCanvas = null;
      this.cctvCtx = null;
      this.cctvTex = null;
      this.isCctvInspecting = false;
      this.cctvInspectTimer = 0;
      this.hasInspectedCctv = false;
      this.savedCamBeforeCctv = null;

      // Pintu Besi "BASEMENT ACCESS - GENERATOR" & Tangga Bawah Tanah
      this.basementDoorPivot = null;
      this.isBasementDoorOpen = true;
      this.dripTimer = 0;

      // Ruang Generator Basement (12m x 10m di y = -4.4m) & Jumpscare Dash
      this.generatorGroup = null;
      this.generatorLeverPivot = null;
      this.isGeneratorRunning = false;
      this.isLeverAnimating = false;
      this.leverAnimStart = 0;
      this.isElevatorPowered = false;

      this.hasTriggeredBasementDash = false;
      this.isBasementDashAnimating = false;
      this.basementDashStart = 0;
      this.basementDashEntity = null;

      // Lampu-lampu Kuning Industri (PointLight intensitas 1.5) yang menyala bertahap
      this.industrialRecoveryLights = [];

      // Kamar 307 Door Group
      this.room307DoorGroup = null;
      this.room307ThudTimer = 0;

      // Environmental Screamers
      this.hasTriggeredElevatorDrop = false;
      this.hasTriggeredVaseDrop = false;
      this.isVaseFalling = false;
      this.vaseFallStart = 0;
      this.vaseFallDuration = 0.42;
      this.vaseMesh = null;
      this.vaseShardsGroup = null;

      // Mekanik Tatapan Fatal (Fatal Gaze Attack System)
      this.stalkerShadowEntity = null;
      this.isStalkerEntityActive = false;
      this.gazeLockTimer = 0;
      this.lastEyeLockWarningAt = 0;
      this.hasTriggeredGazeWarningInSession = false;
      this.hasPlayedStareWarningMonologue = false;
      this.isFatalAttackInProgress = false;
      this.fatalAttackTimer = 0;
      this.fatalAttackEntity = null;
      this.fatalGazeOverlayEl = null;
      this.lastCheckpoint = { x: 2.9, y: 1.68, z: -18.5, yaw: 0 };

      // Kabin Lift Utama Lantai 3 & Sekuens Anjlok ke Lantai 2 (The Stuck Lift Twist)
      this.mainElevatorLeftDoor = null;
      this.mainElevatorRightDoor = null;
      this.elevatorDoorOpenFactor = 0; // 0 = tertutup, 1 = terbuka penuh, 0.5 = terbuka paksa 50%
      this.targetElevatorDoorFactor = 0;
      this.isElevatorDoorSequenceTriggered = false;
      this.isElevatorCabinOpen = false;
      this.isInsideElevatorCabin = false;
      this.isElevatorDescending = false;
      this.isOnFloorTwo = false;
      this.cabinNeonLight = null;
      this.cabinNeonMat = null;
      this.cabinEmergencyLight = null;
      this.cabinFloorIndicatorCanvas = null;
      this.cabinFloorIndicatorCtx = null;
      this.cabinFloorIndicatorTex = null;
      this.rootScene = gameScene.scene;
      this.floorThreeRootGroup = null;
      this.floorTwoGroup = null;
      this.floorTwoWaterMesh = null;
      this.floorTwoNeonLight = null;
      this.floorTwoNeonMat = null;
      this.skylineGroup = null;

      // State Lantai 2 (The Flooded Ward — Looping Corridor, Crawl Escape, Breaker, Reflection, Padlock 7-4-2)
      this.elevatorJammedShutterMesh = null;
      this.targetElevatorShutterY = 1.12; // Saat anjlok di Lantai 2: naik sedikit menyisakan celah bawah 50 cm (center y = 1.40)
      this.hasCrawledOutOfElevator = false;
      this.hasTriggeredFloor2EnterMonologue = false;
      this.waterStepTimer = 0;

      // Rintangan Pintu Tangga Darurat Lantai 2 & Gembok Kombinasi 3 Angka (7-4-2)
      this.floor2StairDoorPivot = null;
      this.floor2ChainsGroup = null;
      this.padlockMesh = null;
      this.isChainsFalling = false;
      this.chainsFallTimer = 0;
      this.isPadlockUnlocked = false;
      this.isFloor2StairDoorOpen = false;
      this.isFloor2StairDoorAnimating = false;
      this.floor2StairDoorAnimStart = 0;
      this.isFloor2StairDoorSlammedSafe = false;

      // Rintangan Air Berlistrik (Electrified Water Hazard) & Kotak Sekring Kamar 203
      this.isFloor2BreakerOn = true;
      this.electrifiedWaterBox3 = null;
      this.sparkingCableGroup = null;
      this.electricSparkLight = null;
      this.sparkAudioLoopTimer = 0;
      this.hasPlayedSparkWarningMonologue = false;
      this.breakerSwitchMesh = null;
      this.floor2BreakerLeverPivot = null;
      this.isBreakerLeverAnimating = false;
      this.breakerLeverAnimStart = 0;

      // Petunjuk Kode Gembok (Digit 1: "7" di Kamar 203, Digit 2-3: "4 - 2" di Kamar 205)
      this.hasReadRoom201Memo = false;
      this.hasDigit7 = false;
      this.hasDigits42 = false;
      this.hasFullPadlockCode = false;

      // Sistem Pantulan Air (Water Reflection Hazard) & Pengejaran di Air (Water Dash Scare)
      this.floor2ReflectionEntity = null;
      this.waterReflectionEyesGroup = null;
      this.hasPlayedReflectionWarningMonologue = false;
      this.reflectionGraceTimer = 0;
      this.floor2ChaseEntity = null;
      this.isFloor2WaterChaseActive = false;
      this.floorTwoExitSignLights = [];
      this.floor2ExitSignLights = this.floorTwoExitSignLights;
      this.electricArcMat = null;
      this.genStatusLight = null;
      this.isCutsceneLocked = false;

      // State Lantai 1 (Ground / Koridor Staf) & Komunikasi Radio Maya-Dhafir
      this.isOnFloorOne = false;
      this.floor1StairExitDoorPivot = null;
      this.isFloor1EntryDoorOpen = false;
      this.isFloor1EntryDoorAnimating = false;
      this.floor1EntryDoorAnimStart = 0;

      this.radioHTMesh = null;
      this.radioLEDMesh = null;
      this.radioLEDMat = null;
      this.radioLEDLight = null;
      this.hasTriggeredRadioStaticCall = false;
      this.isRadioRinging = false;
      this.hasPickedUpRadioHT = false;
      this.isRadioTransmitting = false;
      this.hasCompletedDhafirRadioDialog = false;

      this.floor1DoubleDoorLeftPivot = null;
      this.floor1DoubleDoorRightPivot = null;
      this.floor1DoubleDoorLockLight = null;
      this.floor1DoubleDoorLockMat = null;
      this.isFloor1DoubleDoorUnlocked = false;
      this.isFloor1DoubleDoorAnimating = false;
      this.floor1DoubleDoorAnimStart = 0;
      this.floor1StaffNeonLights = [];
      this.floor1LobbyEntity = null;

      // State Ruang Arsip Terjebak Lantai 1 (The Panic Archive) & Pelarian Lobi Utama
      this.archiveDoorMesh = null;
      this.archiveExitDoorPivot = null;
      this.archiveExitDoorMesh = null;
      this.archiveElectronicPanelMat = null;
      this.archiveElectronicSparkLight = null;
      this.archiveHingeSparksPoints = null;
      this.archiveHingeSparksMat = null;
      this.archiveHingeSmokeGroup = null;
      this.archiveBreachFlashLight = null;
      this.hasTriggeredArchiveTrap = false;
      this.isPlayerTrappedInArchive = false;
      this.isArchiveDoorSlamAnimating = false;
      this.archiveDoorSlamStart = 0;
      this.isArchiveExitBreached = false;
      this.isArchiveBreachAnimating = false;
      this.archiveBreachAnimStart = 0;
      this.isMainLobbyUnlocked = false;
      this.hasReachedMainLobbyExit = false;

      // Audio / Monologue Lock
      this.isActionBusy = false;
      this.activeMonologueTimer = null;
      this._ensureFatalGazeOverlayDOM();
    }

    buildExpansionMap(sharedMats) {
      const THREE = window.THREE;

      this.corridorFloorMat = new THREE.MeshStandardMaterial({
        map: sharedMats.crackedTileTex,
        color: 0x2d3036,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      this.corridorWallMat = new THREE.MeshStandardMaterial({
        map: sharedMats.mossyWallTex,
        color: 0x2d3036,
        roughness: 0.7,
        metalness: 0.1
      });

      this.corridorCeilingMat = new THREE.MeshStandardMaterial({
        color: 0x222428,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      this.baseboardMat = new THREE.MeshStandardMaterial({
        map: sharedMats.woodTex,
        color: 0x2b1911,
        roughness: 0.72,
        metalness: 0.08
      });

      this.ductMetalMat = new THREE.MeshStandardMaterial({
        color: 0x3b4046,
        roughness: 0.42,
        metalness: 0.68
      });

      this.darkWoodMat = sharedMats.darkWoodMat;

      this.rootScene = this.scene;
      this.floorThreeRootGroup = new THREE.Group();
      this.rootScene.add(this.floorThreeRootGroup);

      // Arahkan penambahan mesh Lantai 3 ke dalam floorThreeRootGroup agar dapat disembunyikan
      // sepenuhnya saat kabin lift anjlok ke Lantai 2 (The Flooded Ward)
      this.scene = this.floorThreeRootGroup;

      this._buildWestWingDetailsAndPlates();
      this._buildCentralHubLobby();
      this._buildDeadCitySkylineCurtainsAndMaintenance3B();
      this._buildTwinElevatorsAndCorridorEntity();
      this._buildEastWingAndInteractiveDoors();
      this._buildRoom304Interior();
      this._buildBarricadedStairwell();
      this._buildConsoleTableAndFallingVase();
      this._buildCeilingPipesDuctsAndVents();
      this._buildEmergencyWallLights();
      this._buildBasementStairwellAndMachineRoom();

      this.scene = this.rootScene;
    }

    _createRoomNumberPlate(roomNumberStr, x, y, z, rotY) {
      const THREE = window.THREE;
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#3a2e1e';
      ctx.fillRect(0, 0, 128, 64);
      ctx.strokeStyle = '#a68956';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 120, 56);

      ctx.fillStyle = '#e8d8b5';
      ctx.font = 'bold 30px "Cinzel", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(roomNumberStr, 64, 34);

      const tex = new THREE.CanvasTexture(canvas);
      const plateMat = new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0x261e12,
        emissiveMap: tex,
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.78
      });

      const plateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.018), plateMat);
      plateMesh.position.set(x, y, z);
      plateMesh.rotation.y = rotY;
      this.scene.add(plateMesh);
    }

    _addBaseboard(x, z, length, axis) {
      const THREE = window.THREE;
      const geo = axis === 'z'
        ? new THREE.BoxGeometry(0.04, 0.15, length)
        : new THREE.BoxGeometry(length, 0.15, 0.04);
      const mesh = new THREE.Mesh(geo, this.baseboardMat);
      mesh.position.set(x, 0.075, z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    _buildWestWingDetailsAndPlates() {
      this._addBaseboard(-1.31, -9.0, 12.1, 'z');
      this._addBaseboard(1.31, -7.6, 9.3, 'z');
      this._addBaseboard(0, -14.91, 2.8, 'x');

      this._createRoomNumberPlate('302', 0.68, 1.62, -3.09, Math.PI);
      this._createRoomNumberPlate('301', -1.31, 1.62, -5.52, Math.PI / 2);
      this._createRoomNumberPlate('303', 1.31, 1.62, -6.82, -Math.PI / 2);
    }

    _buildCentralHubLobby() {
      const THREE = window.THREE;

      const lobbyFloor = new THREE.Mesh(
        new THREE.BoxGeometry(10.3, 0.1, 8.2),
        this.corridorFloorMat
      );
      lobbyFloor.position.set(6.4, -0.05, -13.6);
      lobbyFloor.receiveShadow = true;
      this.scene.add(lobbyFloor);

      const lobbyCeiling = new THREE.Mesh(
        new THREE.BoxGeometry(10.3, 0.12, 8.2),
        this.corridorCeilingMat
      );
      lobbyCeiling.position.set(6.4, 3.26, -13.6);
      this.scene.add(lobbyCeiling);

      const westSoffit = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.28, 3.0),
        this.corridorWallMat
      );
      westSoffit.position.set(1.4, 3.12, -13.6);
      this.scene.add(westSoffit);

      const eastSoffit = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.28, 3.0),
        this.corridorWallMat
      );
      eastSoffit.position.set(11.4, 3.12, -13.6);
      this.scene.add(eastSoffit);

      const westWallSouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.25, 2.7), this.corridorWallMat);
      westWallSouth.position.set(1.4, 1.62, -10.9);
      westWallSouth.receiveShadow = true;
      this.scene.add(westWallSouth);

      const westWallNorth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.25, 2.7), this.corridorWallMat);
      westWallNorth.position.set(1.4, 1.62, -16.3);
      westWallNorth.receiveShadow = true;
      this.scene.add(westWallNorth);

      const eastWallSouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.25, 2.7), this.corridorWallMat);
      eastWallSouth.position.set(11.4, 1.62, -10.9);
      eastWallSouth.receiveShadow = true;
      this.scene.add(eastWallSouth);

      const eastWallNorth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.25, 2.7), this.corridorWallMat);
      eastWallNorth.position.set(11.4, 1.62, -16.3);
      eastWallNorth.receiveShadow = true;
      this.scene.add(eastWallNorth);

      this._addBaseboard(6.4, -9.71, 10.0, 'x');
      this._addBaseboard(1.52, -10.9, 2.6, 'z');
      this._addBaseboard(1.52, -16.3, 2.6, 'z');
      this._addBaseboard(11.28, -10.9, 2.6, 'z');
      this._addBaseboard(11.28, -16.3, 2.6, 'z');

      const pillarGeo = new THREE.BoxGeometry(0.38, 3.25, 0.38);
      [
        [2.6, 1.62, -10.1],
        [10.2, 1.62, -10.1],
        [4.4, 1.62, -17.1],
        [10.2, 1.62, -17.1]
      ].forEach(([px, py, pz]) => {
        const pillar = new THREE.Mesh(pillarGeo, this.corridorWallMat);
        pillar.position.set(px, py, pz);
        pillar.receiveShadow = true;
        this.scene.add(pillar);
      });

      const fixtureFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.06, 0.48),
        this.ductMetalMat
      );
      fixtureFrame.position.set(6.4, 3.18, -13.6);
      this.scene.add(fixtureFrame);

      this.lobbyNeonMat = new THREE.MeshStandardMaterial({
        color: 0xfff6e5,
        emissive: 0xffeecc,
        emissiveIntensity: 0.2,
        roughness: 0.25
      });
      const neonDiffuser = new THREE.Mesh(
        new THREE.BoxGeometry(2.25, 0.04, 0.38),
        this.lobbyNeonMat
      );
      neonDiffuser.position.set(6.4, 3.15, -13.6);
      this.scene.add(neonDiffuser);

      this.lobbyNeonLight = new THREE.PointLight(0xffeecc, 0.95, 13.0, 2);
      this.lobbyNeonLight.position.set(6.4, 2.95, -13.6);
      this.scene.add(this.lobbyNeonLight);
    }

    /**
     * Dinding Utara Lobi (Seberang Lift):
     * - Sisi Kiri (x = 1.4 s/d 4.4): Pintu Ruang Panel 3B ("MAINTENANCE 3B - AUTHORIZED PERSONNEL ONLY")
     *   beserta ruangan interior Maintenance 3B di baliknya.
     * - Sisi Kanan (x = 4.4 s/d 11.4): Deretan Jendela Kaca Besar, Gorden Dua Tahap, & Skyline Kota Mati.
     */
    _buildDeadCitySkylineCurtainsAndMaintenance3B() {
      const THREE = window.THREE;

      // ====================================================================
      // 1. PINTU & RUANG PANEL 3B (MAINTENANCE 3B) DI SEBERANG LIFT (x = 2.9, z = -17.6)
      // ====================================================================
      // Dinding di kiri & kanan pintu Maintenance 3B (x: 1.4..2.4 dan x: 3.4..4.4)
      const mWallLeft = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.25, 0.22), this.corridorWallMat);
      mWallLeft.position.set(1.9, 1.62, -17.6);
      this.scene.add(mWallLeft);

      const mWallRight = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.25, 0.22), this.corridorWallMat);
      mWallRight.position.set(3.9, 1.62, -17.6);
      this.scene.add(mWallRight);

      const mWallHeader = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 0.22), this.corridorWallMat);
      mWallHeader.position.set(2.9, 2.7, -17.6);
      this.scene.add(mWallHeader);

      // Kusen & Daun Pintu Baja Maintenance 3B
      const steelDoorMat = new THREE.MeshStandardMaterial({
        color: 0x2c3238,
        roughness: 0.45,
        metalness: 0.78
      });

      this.maintenance3BDoorPivot = new THREE.Group();
      this.maintenance3BDoorPivot.position.set(2.42, 0, -17.58);
      this.scene.add(this.maintenance3BDoorPivot);

      const mDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.96, 2.15, 0.06), steelDoorMat);
      mDoorMesh.position.set(0.48, 1.075, 0);
      mDoorMesh.castShadow = true;
      mDoorMesh.receiveShadow = true;
      mDoorMesh.userData = { interactableType: 'maintenance_3b_door' };
      this.maintenance3BDoorPivot.add(mDoorMesh);

      // Pelat Metalik "MAINTENANCE 3B - AUTHORIZED PERSONNEL ONLY" pada pintu & dinding samping
      const signCanvas = document.createElement('canvas');
      signCanvas.width = 512;
      signCanvas.height = 160;
      const sctx = signCanvas.getContext('2d');
      sctx.fillStyle = '#181c20';
      sctx.fillRect(0, 0, 512, 160);
      sctx.strokeStyle = '#b91c1c';
      sctx.lineWidth = 8;
      sctx.strokeRect(8, 8, 496, 144);
      sctx.fillStyle = '#f8fafc';
      sctx.font = 'bold 34px "Share Tech Mono", monospace';
      sctx.textAlign = 'center';
      sctx.fillText('MAINTENANCE 3B', 256, 68);
      sctx.fillStyle = '#f87171';
      sctx.font = 'bold 22px "Share Tech Mono", monospace';
      sctx.fillText('AUTHORIZED PERSONNEL ONLY', 256, 114);

      const signTex = new THREE.CanvasTexture(signCanvas);
      const signMat = new THREE.MeshStandardMaterial({
        map: signTex,
        emissive: 0x2a0808,
        emissiveMap: signTex,
        emissiveIntensity: 0.6,
        roughness: 0.35,
        metalness: 0.7
      });

      const doorSignMesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.015), signMat);
      doorSignMesh.position.set(0.48, 1.48, 0.035);
      doorSignMesh.userData = { interactableType: 'maintenance_3b_door' };
      this.maintenance3BDoorPivot.add(doorSignMesh);

      this.interactables.push(mDoorMesh, doorSignMesh);

      // ====================================================================
      // INTERIOR RUANG PANEL 3B (MAINTENANCE & SECURITY ROOM — 6m x 5m)
      // Koordinat: x dari -0.1 s/d +5.9 (6.0m), z dari -17.6 s/d -22.6 (5.0m)
      // ====================================================================
      const mFloor = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.1, 5.2), this.corridorFloorMat);
      mFloor.position.set(2.9, -0.05, -20.1);
      mFloor.receiveShadow = true;
      this.scene.add(mFloor);

      const mCeil = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.1, 5.2), this.corridorCeilingMat);
      mCeil.position.set(2.9, 3.1, -20.1);
      this.scene.add(mCeil);

      // Dinding Kiri (x = -0.1), Kanan (x = +5.9), & Depan-Kiri (z = -17.6, x = -0.1..1.4)
      const mLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.15, 5.2), this.corridorWallMat);
      mLeftWall.position.set(-0.1, 1.55, -20.1);
      mLeftWall.receiveShadow = true;
      this.scene.add(mLeftWall);

      const mRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.15, 5.2), this.corridorWallMat);
      mRightWall.position.set(5.9, 1.55, -20.1);
      mRightWall.receiveShadow = true;
      this.scene.add(mRightWall);

      const mFrontExtWall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.15, 0.18), this.corridorWallMat);
      mFrontExtWall.position.set(0.65, 1.55, -17.6);
      this.scene.add(mFrontExtWall);

      // Dinding Belakang (z = -22.6) dengan Bukaan Lebar Penuh (x = 3.0 s/d 4.8, lebar 1.8m)
      // agar akses turun ke Tangga Basement terbuka 100% tanpa balok penghalang!
      const mBackWallLeft = new THREE.Mesh(new THREE.BoxGeometry(3.1, 3.15, 0.18), this.corridorWallMat);
      mBackWallLeft.position.set(1.45, 1.55, -22.6);
      mBackWallLeft.receiveShadow = true;
      this.scene.add(mBackWallLeft);

      const mBackWallRight = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.15, 0.18), this.corridorWallMat);
      mBackWallRight.position.set(5.35, 1.55, -22.6);
      mBackWallRight.receiveShadow = true;
      this.scene.add(mBackWallRight);

      const mBackWallHeader = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.78, 0.18), this.corridorWallMat);
      mBackWallHeader.position.set(3.9, 2.72, -22.6);
      this.scene.add(mBackWallHeader);

      // Meja Kerja Keamanan (x = 1.25, z = -21.2) dengan 3 Unit Monitor Tabung CCTV Jadul
      const secDesk = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.78, 0.82), this.darkWoodMat);
      secDesk.position.set(1.25, 0.39, -21.2);
      secDesk.castShadow = true;
      secDesk.receiveShadow = true;
      this.scene.add(secDesk);

      // Buat CanvasTexture Dinamis untuk Layar Hijau Fosfor CRT CCTV (Scanline/Noise + Penampakan)
      this.cctvCanvas = document.createElement('canvas');
      this.cctvCanvas.width = 256;
      this.cctvCanvas.height = 192;
      this.cctvCtx = this.cctvCanvas.getContext('2d');
      this.cctvTex = new THREE.CanvasTexture(this.cctvCanvas);

      const cctvScreenMat = new THREE.MeshBasicMaterial({
        map: this.cctvTex
      });
      const crtCasingMat = new THREE.MeshStandardMaterial({
        color: 0x222629,
        roughness: 0.65,
        metalness: 0.35
      });

      // 3 Unit Monitor Tabung CCTV di atas meja keamanan
      [-0.62, 0, 0.62].forEach((offsetX, idx) => {
        const monGroup = new THREE.Group();
        monGroup.position.set(1.25 + offsetX, 1.05, -21.2);
        monGroup.rotation.y = (idx === 0) ? 0.22 : (idx === 2) ? -0.22 : 0;

        const casing = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.44, 0.46), crtCasingMat);
        casing.castShadow = true;
        casing.userData = { interactableType: 'cctv_monitor' };
        monGroup.add(casing);

        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.34), cctvScreenMat);
        screen.position.set(0, 0.01, 0.235);
        screen.userData = { interactableType: 'cctv_monitor' };
        monGroup.add(screen);

        this.scene.add(monGroup);
        this.interactables.push(casing, screen);
      });

      // Cahaya hijau fosfor redup dari ketiga layar monitor CCTV
      const cctvGlowLight = new THREE.PointLight(0x33dd66, 0.75, 4.5, 2);
      cctvGlowLight.position.set(1.25, 1.25, -20.6);
      this.scene.add(cctvGlowLight);

      // Rak Perkakas Besi (x = 5.25, z = -19.8) & Papan Gantungan Kunci Kosong
      const toolRack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.95, 1.4), this.ductMetalMat);
      toolRack.position.set(5.35, 0.975, -19.8);
      toolRack.castShadow = true;
      this.scene.add(toolRack);

      const emptyKeyBoard = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 0.04), this.darkWoodMat);
      emptyKeyBoard.position.set(1.25, 1.72, -22.48);
      this.scene.add(emptyKeyBoard);

      // Lampu Ruangan Maintenance 3B
      const mRoomLight = new THREE.PointLight(0xffaa55, 0.65, 8.5, 2);
      mRoomLight.position.set(2.9, 2.8, -20.1);
      this.scene.add(mRoomLight);
      this.industrialRecoveryLights.push({ light: mRoomLight, targetIntensity: 1.5 });

      // ====================================================================
      // 2. JENDELA KACA BESAR & GORDEN INTERAKTIF (x = 4.4 s/d 11.4, z = -17.6)
      // ====================================================================
      const winBottomWall = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.78, 0.22), this.corridorWallMat);
      winBottomWall.position.set(7.9, 0.39, -17.6);
      winBottomWall.receiveShadow = true;
      this.scene.add(winBottomWall);

      const winTopWall = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.48, 0.22), this.corridorWallMat);
      winTopWall.position.set(7.9, 2.98, -17.6);
      this.scene.add(winTopWall);

      const windowSill = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.06, 0.32), this.baseboardMat);
      windowSill.position.set(7.9, 0.79, -17.52);
      this.scene.add(windowSill);

      const ironMat = new THREE.MeshStandardMaterial({
        color: 0x16191d,
        roughness: 0.45,
        metalness: 0.82
      });

      for (let x = 4.6; x <= 11.2; x += 1.65) {
        const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.02, 0.24), ironMat);
        mullion.position.set(x, 1.78, -17.6);
        this.scene.add(mullion);
      }

      const horizBar = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.06, 0.24), ironMat);
      horizBar.position.set(7.9, 1.78, -17.6);
      this.scene.add(horizBar);

      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x101c29,
        transparent: true,
        opacity: 0.26,
        roughness: 0.1,
        metalness: 0.88
      });
      const windowGlassMesh = new THREE.Mesh(new THREE.BoxGeometry(6.7, 1.98, 0.04), glassMat);
      windowGlassMesh.position.set(7.9, 1.78, -17.6);
      windowGlassMesh.userData = { interactableType: 'lobby_window' };
      this.scene.add(windowGlassMesh);
      this.interactables.push(windowGlassMesh);

      const curtainRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 6.8, 12),
        ironMat
      );
      curtainRod.rotation.z = Math.PI / 2;
      curtainRod.position.set(7.9, 2.84, -17.34);
      this.scene.add(curtainRod);

      const curtainFabricMat = new THREE.MeshStandardMaterial({
        color: 0x2c1618,
        roughness: 0.92,
        metalness: 0.04,
        side: THREE.DoubleSide
      });

      this.curtainLeft = this._createPleatedCurtainMesh(3.35, 2.25, curtainFabricMat);
      this.curtainLeft.position.set(6.22, 1.71, -17.36);
      this.scene.add(this.curtainLeft);

      this.curtainRight = this._createPleatedCurtainMesh(3.35, 2.25, curtainFabricMat);
      this.curtainRight.position.set(9.58, 1.71, -17.36);
      this.scene.add(this.curtainRight);

      // Skyline Kota Mati Total di Luar Jendela (Ditempatkan dalam grup terpisah di luar jalur
      // tangga basement x >= 6.8 dan y >= 0.25 sehingga TIDAK PERNAH menyumbat lubang tangga!)
      this.skylineGroup = new THREE.Group();
      this.scene.add(this.skylineGroup);

      const nightSkyBackdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(52, 22),
        new THREE.MeshBasicMaterial({ color: 0x0b1018, fog: false })
      );
      nightSkyBackdrop.position.set(11.5, 11.2, -52.0);
      this.skylineGroup.add(nightSkyBackdrop);

      const horizonMist = new THREE.Mesh(
        new THREE.PlaneGeometry(52, 6.5),
        new THREE.MeshBasicMaterial({
          color: 0x131b26,
          transparent: true,
          opacity: 0.55,
          fog: false
        })
      );
      horizonMist.position.set(11.5, 3.5, -50.5);
      this.skylineGroup.add(horizonMist);

      const blackoutBuildingMat = new THREE.MeshStandardMaterial({
        color: 0x161920,
        roughness: 0.95,
        metalness: 0.08
      });

      const skylineBuildings = [
        { x: 7.4,  z: -28.0, w: 3.2, h: 14.5, d: 3.2 },
        { x: 11.2, z: -31.0, w: 4.2, h: 21.0, d: 4.0 },
        { x: 15.6, z: -27.5, w: 3.8, h: 16.5, d: 3.8 },
        { x: 20.2, z: -33.0, w: 5.0, h: 24.0, d: 4.6 }
      ];

      skylineBuildings.forEach((b) => {
        const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), blackoutBuildingMat);
        // Bagian bawah gedung berada di y = 0.25 (tidak pernah menembus ke bawah lantai 3 / tangga basement)
        bMesh.position.set(b.x, b.h * 0.5 + 0.25, b.z);
        this.skylineGroup.add(bMesh);
      });

      this.skyFlashLight = new THREE.PointLight(0x5b7ea2, 0.14, 48, 1.1);
      this.skyFlashLight.position.set(7.9, 9.5, -24.0);
      this.scene.add(this.skyFlashLight);
    }

    _createPleatedCurtainMesh(width, height, material) {
      const THREE = window.THREE;
      const group = new THREE.Group();

      const basePanel = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.04), material);
      basePanel.castShadow = true;
      basePanel.receiveShadow = true;
      basePanel.userData = { interactableType: 'lobby_window' };
      group.add(basePanel);
      this.interactables.push(basePanel);

      const pleatCount = 7;
      for (let i = 0; i < pleatCount; i++) {
        const px = -width * 0.46 + (i / (pleatCount - 1)) * (width * 0.92);
        const pleat = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.055, height, 8),
          material
        );
        pleat.position.set(px, 0, 0.025);
        pleat.castShadow = true;
        pleat.userData = { interactableType: 'lobby_window' };
        group.add(pleat);
        this.interactables.push(pleat);
      }

      return group;
    }

    _buildTwinElevatorsAndCorridorEntity() {
      const THREE = window.THREE;

      // Dinding Selatan Lobi (z = -9.6) dengan Bukaan Penuh pada Lift Kanan (x = 7.15 s/d 8.65)
      // agar pemain dapat melangkah masuk ke dalam Kabin Lift Utama saat pintunya terbuka!
      const southWallLeft = new THREE.Mesh(
        new THREE.BoxGeometry(5.85, 3.25, 0.22),
        this.corridorWallMat
      );
      southWallLeft.position.set(4.225, 1.62, -9.6);
      southWallLeft.receiveShadow = true;
      this.scene.add(southWallLeft);

      const southWallRight = new THREE.Mesh(
        new THREE.BoxGeometry(2.85, 3.25, 0.22),
        this.corridorWallMat
      );
      southWallRight.position.set(10.075, 1.62, -9.6);
      southWallRight.receiveShadow = true;
      this.scene.add(southWallRight);

      const southWallElevHeader = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.95, 0.22),
        this.corridorWallMat
      );
      southWallElevHeader.position.set(7.9, 2.76, -9.6);
      this.scene.add(southWallElevHeader);

      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x363b42,
        roughness: 0.38,
        metalness: 0.78
      });

      const shaftVoidMat = new THREE.MeshBasicMaterial({ color: 0x121418 });
      const cableMat = new THREE.MeshStandardMaterial({
        color: 0x1f2326,
        roughness: 0.55,
        metalness: 0.85
      });

      [4.9, 7.9].forEach((elevX, idx) => {
        const elevGroup = new THREE.Group();
        elevGroup.position.set(elevX, 0, -9.7);

        const topFrame = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.14, 0.2), steelMat);
        topFrame.position.set(0, 2.28, 0);
        elevGroup.add(topFrame);

        const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.35, 0.2), steelMat);
        leftFrame.position.set(-0.7, 1.175, 0);
        elevGroup.add(leftFrame);

        const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.35, 0.2), steelMat);
        rightFrame.position.set(0.7, 1.175, 0);
        elevGroup.add(rightFrame);

        if (idx === 0) {
          // Lift Kiri (x = 4.9): Shaft gelap dengan celah kabel
          const shaftVoid = new THREE.Mesh(new THREE.BoxGeometry(1.36, 2.24, 0.48), shaftVoidMat);
          shaftVoid.position.set(0, 1.12, 0.22);
          elevGroup.add(shaftVoid);

          const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 2.2, 8), cableMat);
          cable.position.set(0, 1.12, 0.12);
          elevGroup.add(cable);
        }

        const doorLeafGeo = new THREE.BoxGeometry(0.64, 2.2, 0.06);
        const leftLeaf = new THREE.Mesh(doorLeafGeo, steelMat);
        leftLeaf.position.set(idx === 0 ? -0.34 : -0.32, 1.1, -0.02);
        leftLeaf.castShadow = true;
        leftLeaf.userData = { interactableType: 'elevator' };
        elevGroup.add(leftLeaf);

        const rightLeaf = new THREE.Mesh(doorLeafGeo, steelMat);
        rightLeaf.position.set(idx === 0 ? 0.34 : 0.32, 1.1, -0.02);
        rightLeaf.castShadow = true;
        rightLeaf.userData = { interactableType: 'elevator' };
        elevGroup.add(rightLeaf);

        if (idx === 1) {
          this.mainElevatorLeftDoor = leftLeaf;
          this.mainElevatorRightDoor = rightLeaf;
        }

        this.scene.add(elevGroup);
        this.interactables.push(leftLeaf, rightLeaf);
      });

      // ====================================================================
      // KABIN LIFT UTAMA INTERAKTIF (di belakang pintu lift kanan: x = 7.9, z = -9.6 s/d -7.6)
      // ====================================================================
      const cabinWallMat = new THREE.MeshStandardMaterial({
        color: 0x2d333b,
        roughness: 0.42,
        metalness: 0.68
      });
      const cabinFloorMat = new THREE.MeshStandardMaterial({
        color: 0x1e2228,
        roughness: 0.65,
        metalness: 0.25
      });

      const cabinGroup = new THREE.Group();
      cabinGroup.position.set(7.9, 0, -8.6);
      (this.rootScene || this.scene).add(cabinGroup);

      // Kusen & Panel Pintu Atas Lift yang Macet Setinggi 50 cm saat Anjlok di Lantai 2
      const jammedDoorMat = new THREE.MeshStandardMaterial({
        color: 0x2f353d,
        roughness: 0.42,
        metalness: 0.78
      });
      this.elevatorJammedShutterMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.38, 1.76, 0.08),
        jammedDoorMat
      );
      // Saat terangkat sebagian di Lantai 2 (y = 1.40), bagian bawahnya berada di y = 0.52m (celah merayap 50 cm!)
      this.elevatorJammedShutterMesh.position.set(7.9, 1.40, -9.68);
      this.elevatorJammedShutterMesh.visible = false;
      (this.rootScene || this.scene).add(this.elevatorJammedShutterMesh);

      const cFloor = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 2.1), cabinFloorMat);
      cFloor.position.set(0, -0.05, 0);
      cabinGroup.add(cFloor);

      const cCeil = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 2.1), cabinWallMat);
      cCeil.position.set(0, 2.42, 0);
      cabinGroup.add(cCeil);

      const cBackWall = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.45, 0.12), cabinWallMat);
      cBackWall.position.set(0, 1.2, 1.02);
      cabinGroup.add(cBackWall);

      const cLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.45, 2.1), cabinWallMat);
      cLeftWall.position.set(-0.92, 1.2, 0);
      cabinGroup.add(cLeftWall);

      const cRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.45, 2.1), cabinWallMat);
      cRightWall.position.set(0.92, 1.2, 0);
      cabinGroup.add(cRightWall);

      // Pegangan Tangan Besi (Handrail) di dalam Kabin Lift
      const handrail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.6, 10), steelMat);
      handrail.rotation.z = Math.PI / 2;
      handrail.position.set(0, 0.92, 0.92);
      cabinGroup.add(handrail);

      // Lampu Neon Plafon Kabin Lift & Lampu Darurat Merah (untuk sekuens Lift Anjlok)
      this.cabinNeonMat = new THREE.MeshStandardMaterial({
        color: 0xfff5d6,
        emissive: 0xffe8a3,
        emissiveIntensity: 0.85,
        roughness: 0.2
      });
      const cNeonPanel = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.55), this.cabinNeonMat);
      cNeonPanel.position.set(0, 2.35, 0);
      cabinGroup.add(cNeonPanel);

      this.cabinNeonLight = new THREE.PointLight(0xffe8a3, 1.2, 4.5, 2);
      this.cabinNeonLight.position.set(7.9, 2.22, -8.6);
      (this.rootScene || this.scene).add(this.cabinNeonLight);

      this.cabinEmergencyLight = new THREE.PointLight(0xcc1111, 0.0, 5.0, 1.8);
      this.cabinEmergencyLight.position.set(7.9, 2.2, -8.6);
      (this.rootScene || this.scene).add(this.cabinEmergencyLight);

      // Panel Tombol Lantai Dasar [E] di Dalam Kabin Lift (di dinding samping dekat pintu)
      const innerPanelBox = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 0.24), steelMat);
      innerPanelBox.position.set(-0.84, 1.25, -0.52);
      innerPanelBox.userData = { interactableType: 'elevator_cabin_panel' };
      cabinGroup.add(innerPanelBox);

      const floorOneBtnMat = new THREE.MeshBasicMaterial({ color: 0xb8ff3b });
      const floorOneBtn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.09), floorOneBtnMat);
      floorOneBtn.position.set(-0.82, 1.18, -0.52);
      floorOneBtn.userData = { interactableType: 'elevator_cabin_panel' };
      cabinGroup.add(floorOneBtn);

      const innerPanelHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 1.1, 0.75),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      innerPanelHitbox.position.set(-0.68, 1.25, -0.52);
      innerPanelHitbox.userData = { interactableType: 'elevator_cabin_panel' };
      cabinGroup.add(innerPanelHitbox);

      // Layar Indikator Lantai Kabin ("3" -> "2")
      this.cabinFloorIndicatorCanvas = document.createElement('canvas');
      this.cabinFloorIndicatorCanvas.width = 128;
      this.cabinFloorIndicatorCanvas.height = 64;
      this.cabinFloorIndicatorCtx = this.cabinFloorIndicatorCanvas.getContext('2d');
      this.cabinFloorIndicatorTex = new THREE.CanvasTexture(this.cabinFloorIndicatorCanvas);
      this._updateCabinFloorDisplay('3', '#a3e635');

      const floorDispMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.11),
        new THREE.MeshBasicMaterial({ map: this.cabinFloorIndicatorTex })
      );
      floorDispMesh.rotation.y = Math.PI / 2;
      floorDispMesh.position.set(-0.805, 1.41, -0.52);
      cabinGroup.add(floorDispMesh);

      this.interactables.push(innerPanelBox, floorOneBtn, innerPanelHitbox);

      // Panel Panggil Lift Luar di antara 2 unit lift (x = 6.4, z = -9.8)
      const callPanel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.05), steelMat);
      callPanel.position.set(6.4, 1.22, -9.8);
      callPanel.userData = { interactableType: 'elevator' };
      this.scene.add(callPanel);

      this.elevatorButtonMat = new THREE.MeshBasicMaterial({ color: 0xff1a1a });
      const errorBtnMesh = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.085, 0.06), this.elevatorButtonMat);
      errorBtnMesh.position.set(6.4, 1.24, -9.81);
      errorBtnMesh.userData = { interactableType: 'elevator' };
      this.scene.add(errorBtnMesh);

      const elevHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 2.25, 0.42),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      elevHitbox.position.set(6.4, 1.12, -9.88);
      elevHitbox.userData = { interactableType: 'elevator' };
      this.scene.add(elevHitbox);
      this.interactables.push(callPanel, errorBtnMesh, elevHitbox);

      this.elevatorErrorLight = new THREE.PointLight(0xff1a1a, 0.55, 4.5, 2);
      this.elevatorErrorLight.position.set(6.4, 1.24, -9.98);
      this.scene.add(this.elevatorErrorLight);

      this.elevatorSparkLight = new THREE.PointLight(0x88ddff, 0, 5.0, 1.4);
      this.elevatorSparkLight.position.set(6.4, 1.28, -9.98);
      this.scene.add(this.elevatorSparkLight);

      // Entitas Mata Merah di Koridor Luar dekat Pintu Lift (muncul saat keluar Kamar 304)
      this.corridorRedEyesEntity = createShadowRedEyesEntity(THREE);
      this.corridorRedEyesEntity.position.set(6.4, 0, -11.2);
      this.corridorRedEyesEntity.visible = false;
      this.scene.add(this.corridorRedEyesEntity);

      // Entitas Pengintai Aktif (Stalker Entity) untuk Mekanik Tatapan Fatal (Fatal Gaze)
      this.stalkerShadowEntity = createShadowRedEyesEntity(THREE);
      this.stalkerShadowEntity.position.set(3.9, 0, -19.2);
      this.stalkerShadowEntity.visible = false;
      this.scene.add(this.stalkerShadowEntity);

      // Bangun Visual Koridor Lantai 2 (Tergenang Air Setinggi Mata Kaki & Berantakan)
      // yang akan tampak saat lift anjlok dan pintunya terbuka paksa 50%!
      this._buildFloorTwoFloodedCorridor();
    }

    _updateCabinFloorDisplay(floorText, colorHex) {
      if (!this.cabinFloorIndicatorCtx || !this.cabinFloorIndicatorTex) return;
      const ctx = this.cabinFloorIndicatorCtx;
      ctx.fillStyle = '#090d11';
      ctx.fillRect(0, 0, 128, 64);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 124, 60);
      ctx.fillStyle = colorHex || '#a3e635';
      ctx.font = 'bold 38px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FL ' + floorText, 64, 34);
      this.cabinFloorIndicatorTex.needsUpdate = true;
    }

    /**
     * Membangun Visual Lorong Lantai 2 (Berantakan, Tergenang Air Setinggi Mata Kaki,
     * & Lampu Neon Korsleting) yang muncul di balik pintu lift yang terbuka 50% pasca-anjlok!
     */
    _buildFloorTwoFloodedCorridor() {
      const THREE = window.THREE;
      const targetRoot = this.rootScene || this.scene;

      this.floorTwoGroup = new THREE.Group();
      this.floorTwoGroup.visible = false;
      targetRoot.add(this.floorTwoGroup);

      // Material Dinding & Plafon Lantai 2 (Rona Hijau Lumut Kusam / Karat Basah)
      const f2WallMat = new THREE.MeshStandardMaterial({
        map: this.corridorWallMat.map,
        color: 0x1b2620,
        roughness: 0.78,
        metalness: 0.12
      });
      const f2CeilMat = new THREE.MeshStandardMaterial({
        color: 0x121815,
        roughness: 0.82,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      const f2SubFloorMat = new THREE.MeshStandardMaterial({
        map: this.corridorFloorMat.map,
        color: 0x09110d,
        roughness: 0.65,
        metalness: 0.2
      });

      // 1. MATERIAL GENANGAN AIR SETINGGI MATA KAKI (roughness: 0.15, metalness: 0.35, #0a1410)
      const floodWaterMat = new THREE.MeshStandardMaterial({
        color: 0x0a1410,
        roughness: 0.15,
        metalness: 0.35,
        transparent: true,
        opacity: 0.88
      });

      // Lantai Dasar & Permukaan Air Setinggi Mata Kaki (y = 0.08m) Mencakup Koridor Lantai 2 (z <= -9.7)
      const f2BaseFloor = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.1, 20.0), f2SubFloorMat);
      f2BaseFloor.position.set(11.0, -0.05, -19.7);
      f2BaseFloor.receiveShadow = true;
      this.floorTwoGroup.add(f2BaseFloor);

      this.floorTwoWaterMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(25.5, 19.8, 32, 32),
        floodWaterMat
      );
      this.floorTwoWaterMesh.rotation.x = -Math.PI / 2;
      this.floorTwoWaterMesh.position.set(11.0, 0.08, -19.7);
      this.floorTwoWaterMesh.receiveShadow = true;
      this.floorTwoGroup.add(this.floorTwoWaterMesh);

      const f2Ceiling = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.12, 24.0), f2CeilMat);
      f2Ceiling.position.set(11.0, 3.06, -19.5);
      this.floorTwoGroup.add(f2Ceiling);

      // Helper pembuat segmen dinding Lantai 2
      const addF2Wall = (w, h, d, x, y, z, mat = f2WallMat) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        this.floorTwoGroup.add(m);
        return m;
      };

      // Helper pembuat Penunjuk Arah Darurat Hijau (Emergency Exit Signs: #22c55e, intensitas 1.2)
      const addEmergencyExitSign = (x, y, z, rotY, labelText = 'EXIT // DARURAT') => {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 96;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#062e16';
        ctx.fillRect(0, 0, 256, 96);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, 244, 84);
        ctx.fillStyle = '#bbf7d0';
        ctx.font = 'bold 26px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, 128, 48);

        const tex = new THREE.CanvasTexture(c);
        const signMat = new THREE.MeshStandardMaterial({
          map: tex,
          emissive: 0x22c55e,
          emissiveMap: tex,
          emissiveIntensity: 1.1,
          roughness: 0.25
        });
        const signMesh = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.22, 0.05), signMat);
        signMesh.position.set(x, y, z);
        signMesh.rotation.y = rotY;
        this.floorTwoGroup.add(signMesh);

        const exitLight = new THREE.PointLight(0x22c55e, 1.2, 7.5, 1.8);
        exitLight.position.set(
          x + Math.sin(rotY) * 0.25,
          y - 0.08,
          z + Math.cos(rotY) * 0.25
        );
        this.floorTwoGroup.add(exitLight);
        if (!Array.isArray(this.floorTwoExitSignLights)) {
          this.floorTwoExitSignLights = [];
          this.floor2ExitSignLights = this.floorTwoExitSignLights;
        }
        this.floorTwoExitSignLights.push({ light: exitLight, mat: signMat, phase: Math.random() * 10 });
      };

      // ====================================================================
      // A. TATA RUANG PERSEGI MELINGKAR (LOOPING CORRIDOR LANTAI 2)
      // - Koridor Selatan: x = 4.0 s/d 20.0, z = -9.7 s/d -12.5
      // - Koridor Barat:   x = 4.0 s/d 6.8,  z = -12.5 s/d -24.5
      // - Koridor Timur:   x = 17.2 s/d 20.0, z = -12.5 s/d -24.5
      // - Koridor Utara:   x = 4.0 s/d 20.0, z = -21.7 s/d -24.5
      // - Pulau Tengah (Central Core Block): x = 6.8 s/d 17.2, z = -12.5 s/d -21.7
      // ====================================================================
      // Dinding Selatan Koridor Selatan (z = -9.7) dengan bukaan kabin lift di x = 7.15 s/d 8.65
      addF2Wall(3.15, 3.1, 0.22, 5.575, 1.55, -9.7);
      addF2Wall(11.35, 3.1, 0.22, 14.325, 1.55, -9.7);
      addF2Wall(1.5, 0.85, 0.22, 7.9, 2.68, -9.7);

      // Pulau Tengah (Central Core Block: x = 6.8..17.2, z = -12.5..-21.7)
      addF2Wall(10.4, 3.1, 0.22, 12.0, 1.55, -12.5); // Sisi Selatan pulau tengah
      addF2Wall(10.4, 3.1, 0.22, 12.0, 1.55, -21.7); // Sisi Utara pulau tengah
      addF2Wall(0.22, 3.1, 9.2, 6.8, 1.55, -17.1);   // Sisi Barat pulau tengah
      addF2Wall(0.22, 3.1, 9.2, 17.2, 1.55, -17.1);  // Sisi Timur pulau tengah

      // Dinding Luar Timur Koridor Pintas (x = 20.0, z = -9.7 s/d -24.5)
      addF2Wall(0.22, 3.1, 14.8, 20.0, 1.55, -17.1);

      // Dinding Luar Utara Koridor Utara (z = -24.5, x = 4.0 s/d 17.8, dengan pintu Kamar 205 di x = 18.0..19.2)
      addF2Wall(14.0, 3.1, 0.22, 11.0, 1.55, -24.5);
      addF2Wall(0.8, 3.1, 0.22, 19.6, 1.55, -24.5);
      addF2Wall(1.2, 0.85, 0.22, 18.6, 2.68, -24.5);

      // Pasang Emergency Exit Signs Hijau (#22c55e, intensitas 1.2) di titik-titik sudut lorong
      addEmergencyExitSign(4.15, 2.45, -11.1, Math.PI / 2, '<< EXIT STAIRS');
      addEmergencyExitSign(5.4, 2.45, -12.35, 0, 'WARD 201-203');
      addEmergencyExitSign(18.6, 2.45, -12.35, 0, 'SERVICE 205 >>');
      addEmergencyExitSign(5.4, 2.45, -24.35, 0, 'STORAGE 205 >>');
      addEmergencyExitSign(18.6, 2.45, -24.35, 0, 'ROOM 205');

      // Plafon Ambruk (Collapsed Ceiling Slabs) di Beberapa Titik Lorong
      const debrisMat = new THREE.MeshStandardMaterial({
        color: 0x222924,
        roughness: 0.85,
        metalness: 0.15
      });
      [
        [10.2, 2.55, -11.1, 0.42, 0.15, -0.35],
        [10.5, 0.12, -11.4, 0.08, 0.5, 0.04],
        [5.4, 2.62, -19.2, -0.38, 0.1, 0.28],
        [9.8, 0.11, -23.1, 0.04, -0.4, 0.06]
      ].forEach(([dx, dy, dz, rx, ry, rz]) => {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.06, 0.95), debrisMat);
        slab.position.set(dx, dy, dz);
        slab.rotation.set(rx, ry, rz);
        this.floorTwoGroup.add(slab);
      });

      // ====================================================================
      // B. PINTU TANGGA DARURAT LANTAI 2, RANTAI BESI & GEMBOK 3 ANGKA (x = 4.0, z = -11.1)
      // ====================================================================
      // Dinding Barat Koridor Selatan di sekitar Pintu Tangga Darurat (x = 4.0, z = -9.7..-12.5)
      addF2Wall(0.22, 3.1, 0.8, 4.0, 1.55, -10.1);
      addF2Wall(0.22, 3.1, 0.8, 4.0, 1.55, -12.1);
      addF2Wall(0.22, 0.85, 1.2, 4.0, 2.68, -11.1);

      // Ruang Bordes Tangga Darurat Lantai 2 di balik pintu (x = 0.8 s/d 4.0, z = -9.7 s/d -12.5)
      // Dinding Selatan (z = -9.7) memiliki bukaan lebar (x = 1.0..2.8) untuk Tangga Turun ke Lantai 1!
      addF2Wall(0.2, 3.1, 0.22, 0.9, 1.55, -9.7);
      addF2Wall(1.2, 3.1, 0.22, 3.4, 1.55, -9.7);
      addF2Wall(1.8, 0.75, 0.22, 1.9, 2.72, -9.7);
      addF2Wall(3.2, 3.1, 0.22, 2.4, 1.55, -12.5);
      addF2Wall(0.22, 3.1, 2.8, 0.8, 1.55, -11.1);
      addEmergencyExitSign(1.9, 2.38, -9.82, Math.PI, 'LANTAI 1 // AREA STAF >>');

      const steelDoorMat = new THREE.MeshStandardMaterial({
        color: 0x2b3330,
        roughness: 0.45,
        metalness: 0.78
      });
      this.floor2StairDoorPivot = new THREE.Group();
      this.floor2StairDoorPivot.position.set(4.0, 0, -10.52);
      this.floorTwoGroup.add(this.floor2StairDoorPivot);

      const f2StairDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.22, 1.16), steelDoorMat);
      f2StairDoorMesh.position.set(0, 1.11, -0.58);
      f2StairDoorMesh.userData = { interactableType: 'floor2_padlock' };
      this.floor2StairDoorPivot.add(f2StairDoorMesh);

      // Lilitan Rantai Besi Tebal & Gembok Kombinasi 3 Angka (padlockMesh)
      const chainMat = new THREE.MeshStandardMaterial({
        color: 0x3f3f46,
        roughness: 0.4,
        metalness: 0.88
      });
      this.floor2ChainsGroup = new THREE.Group();
      this.floor2ChainsGroup.position.set(4.08, 1.12, -11.1);
      this.floorTwoGroup.add(this.floor2ChainsGroup);

      for (let i = -1; i <= 1; i++) {
        const chainBar = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1.22, 10), chainMat);
        chainBar.rotation.x = Math.PI / 2 + i * 0.22;
        chainBar.position.set(0, i * 0.12, 0);
        chainBar.userData = { interactableType: 'floor2_padlock' };
        this.floor2ChainsGroup.add(chainBar);
      }

      // Gembok Kombinasi 3 Angka (padlockMesh)
      const brassPadlockMat = new THREE.MeshStandardMaterial({
        color: 0xb48327,
        emissive: 0x332205,
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.85
      });
      this.padlockMesh = new THREE.Group();
      this.padlockMesh.position.set(4.14, 1.08, -11.1);
      this.floorTwoGroup.add(this.padlockMesh);

      const padlockBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.16), brassPadlockMat);
      padlockBody.userData = { interactableType: 'floor2_padlock' };
      this.padlockMesh.add(padlockBody);

      const padlockShackle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 10, 18, Math.PI), chainMat);
      padlockShackle.rotation.y = Math.PI / 2;
      padlockShackle.position.set(0, 0.11, 0);
      padlockShackle.userData = { interactableType: 'floor2_padlock' };
      this.padlockMesh.add(padlockShackle);

      // 3 Roda Angka Kombinasi pada Gembok
      [-0.04, 0, 0.04].forEach((dy) => {
        const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.022, 12), chainMat);
        dial.position.set(0.015, dy, 0);
        dial.userData = { interactableType: 'floor2_padlock' };
        this.padlockMesh.add(dial);
      });

      const padlockHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 1.5, 1.35),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      padlockHitbox.position.set(4.15, 1.15, -11.1);
      padlockHitbox.userData = { interactableType: 'floor2_padlock' };
      this.floorTwoGroup.add(padlockHitbox);

      this.interactables.push(f2StairDoorMesh, padlockBody, padlockShackle, padlockHitbox);

      // ====================================================================
      // C. BAHAYA AIR BERLISTRIK (ELECTRIFIED WATER HAZARD) DI KORIDOR TIMUR (x = 18.6, z = -17.5)
      // ====================================================================
      this.electrifiedWaterBox3 = new THREE.Box3(
        new THREE.Vector3(17.2, -0.5, -19.1),
        new THREE.Vector3(20.0, 2.5, -15.9)
      );

      this.sparkingCableGroup = new THREE.Group();
      this.sparkingCableGroup.position.set(18.6, 0, -17.5);
      this.floorTwoGroup.add(this.sparkingCableGroup);

      const cableWireMat = new THREE.MeshStandardMaterial({
        color: 0x111317,
        roughness: 0.6,
        metalness: 0.4
      });
      const danglingCable = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 3.05, 10), cableWireMat);
      danglingCable.position.set(0, 1.52, 0);
      danglingCable.rotation.z = 0.08;
      this.sparkingCableGroup.add(danglingCable);

      // Cincin Busur Listrik Biru-Putih di Permukaan Air
      this.electricArcMat = new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.85
      });
      const arcRing = new THREE.Mesh(new THREE.RingGeometry(0.25, 1.15, 24), this.electricArcMat);
      arcRing.rotation.x = -Math.PI / 2;
      arcRing.position.set(0, 0.095, 0);
      this.sparkingCableGroup.add(arcRing);

      this.electricSparkLight = new THREE.PointLight(0x60a5fa, 2.2, 8.5, 1.6);
      this.electricSparkLight.position.set(18.6, 0.35, -17.5);
      this.floorTwoGroup.add(this.electricSparkLight);

      // ====================================================================
      // D. KAMAR 201 (MEJA RIAS + MEMO PANTULAN AIR), TEMBOK JEBOL, & KAMAR 203 (SEKRING + ANGKA "7")
      // - Kamar 201: x = 0.0 s/d 4.0, z = -14.0 s/d -18.4
      // - Kamar 203: x = 0.0 s/d 4.0, z = -18.4 s/d -22.8
      // ====================================================================
      // Dinding Barat Koridor Barat (x = 4.0, z = -12.5 s/d -24.5) dengan Bukaan Pintu Kamar 201 di z = -15.65..-16.75
      addF2Wall(0.22, 3.1, 3.15, 4.0, 1.55, -14.075);
      addF2Wall(0.22, 3.1, 7.75, 4.0, 1.55, -20.625);
      addF2Wall(0.22, 0.85, 1.1, 4.0, 2.68, -16.2);

      this._createRoomNumberPlateForGroup(this.floorTwoGroup, '201', 4.12, 1.62, -15.35, Math.PI / 2);
      this._createRoomNumberPlateForGroup(this.floorTwoGroup, '203', 4.12, 1.62, -20.2, Math.PI / 2);

      // Daun Pintu Kamar 201 Terbuka Separuh (rotation.y = 0.78 rad ke dalam kamar)
      const r201DoorPivot = new THREE.Group();
      r201DoorPivot.position.set(4.0, 0, -15.68);
      r201DoorPivot.rotation.y = -0.82;
      this.floorTwoGroup.add(r201DoorPivot);

      const r201DoorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.15, 1.02), this.darkWoodMat);
      r201DoorLeaf.position.set(0, 1.075, -0.51);
      r201DoorPivot.add(r201DoorLeaf);

      // Dinding Luar Kamar 201 & 203 (Barat x = 0.0, Selatan z = -14.0, Utara z = -22.8)
      addF2Wall(4.0, 3.1, 0.22, 2.0, 1.55, -14.0);
      addF2Wall(4.0, 3.1, 0.22, 2.0, 1.55, -22.8);
      addF2Wall(0.22, 3.1, 8.8, 0.0, 1.55, -18.4);

      // DINDING PEMBATAS KAMAR 201 & KAMAR 203 YANG JEBOL BERLUBANG BESAR (z = -18.4)
      // Lubang jebol di x = 1.25 s/d 2.75 (lebar 1.5m) dan tinggi 1.18m dari lantai (bisa dilewati dengan merunduk!)
      addF2Wall(1.25, 3.1, 0.24, 0.625, 1.55, -18.4);
      addF2Wall(1.25, 3.1, 0.24, 3.375, 1.55, -18.4);
      // Balok dinding atas di atas lubang jebol (mulai dari y = 1.18m ke y = 3.1m)
      addF2Wall(1.5, 1.92, 0.24, 2.0, 2.14, -18.4);

      // Puing-puing Bata Pecah di Sekitar Lubang Tembok Jebol (z = -18.4)
      [
        [1.35, 0.14, -18.15, 0.2, 0.4, 0.1],
        [2.62, 0.14, -18.62, -0.1, 0.7, 0.2],
        [1.95, 0.10, -18.38, 0.05, -0.3, 0.08]
      ].forEach(([bx, by, bz, rx, ry, rz]) => {
        const brick = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.22), debrisMat);
        brick.position.set(bx, by, bz);
        brick.rotation.set(rx, ry, rz);
        this.floorTwoGroup.add(brick);
      });

      // Meja Rias Kamar 201 (x = 1.15, z = -15.15) & Memo Penghuni tentang Pantulan Air
      const vanityDesk = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.78, 0.65), this.darkWoodMat);
      vanityDesk.position.set(1.15, 0.39, -15.15);
      vanityDesk.userData = { interactableType: 'room201_memo' };
      this.floorTwoGroup.add(vanityDesk);

      const memoCanvas = document.createElement('canvas');
      memoCanvas.width = 256;
      memoCanvas.height = 256;
      const mctx = memoCanvas.getContext('2d');
      mctx.fillStyle = '#e7dec8';
      mctx.fillRect(0, 0, 256, 256);
      mctx.fillStyle = '#1c1917';
      mctx.font = 'bold 18px monospace';
      mctx.fillText('CATATAN PENGHUNI 201', 18, 38);
      mctx.fillStyle = '#991b1b';
      mctx.font = 'bold 16px monospace';
      mctx.fillText('JANGAN LIHAT AIRNYA!', 18, 76);
      mctx.fillStyle = '#292524';
      mctx.font = '14px monospace';
      mctx.fillText('Mata merah itu memantul', 18, 114);
      mctx.fillText('di genangan air lorong.', 18, 138);
      mctx.fillText('Buang muka ke dinding', 18, 172);
      mctx.fillText('samping saat lewat!', 18, 196);

      const memoTex = new THREE.CanvasTexture(memoCanvas);
      const room201MemoMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.02, 0.32),
        new THREE.MeshStandardMaterial({
          map: memoTex,
          emissive: 0x332b1a,
          emissiveMap: memoTex,
          emissiveIntensity: 0.55
        })
      );
      room201MemoMesh.position.set(1.15, 0.80, -15.15);
      room201MemoMesh.userData = { interactableType: 'room201_memo' };
      this.floorTwoGroup.add(room201MemoMesh);

      const memoHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 1.2, 0.9),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      memoHitbox.position.set(1.15, 0.85, -15.15);
      memoHitbox.userData = { interactableType: 'room201_memo' };
      this.floorTwoGroup.add(memoHitbox);
      this.interactables.push(vanityDesk, room201MemoMesh, memoHitbox);

      const r201Light = new THREE.PointLight(0xffb366, 0.75, 6.0, 2);
      r201Light.position.set(1.5, 2.4, -16.0);
      this.floorTwoGroup.add(r201Light);

      // ====================================================================
      // E. KAMAR 203: KOTAK SEKRING MANUAL (breakerSwitchMesh) & ANGKA "7" DI DINDING
      // ====================================================================
      const breakerBoxGroup = new THREE.Group();
      breakerBoxGroup.position.set(0.18, 1.38, -20.85);
      this.floorTwoGroup.add(breakerBoxGroup);

      const breakerCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 0.44), steelDoorMat);
      breakerCabinet.userData = { interactableType: 'floor2_breaker' };
      breakerBoxGroup.add(breakerCabinet);

      this.floor2BreakerLeverPivot = new THREE.Group();
      this.floor2BreakerLeverPivot.position.set(0.09, 0.05, 0);
      this.floor2BreakerLeverPivot.rotation.z = -0.45; // Posisi awal ON (ke atas)
      breakerBoxGroup.add(this.floor2BreakerLeverPivot);

      const rustyHandleMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        emissive: 0x450a0a,
        emissiveIntensity: 0.6,
        roughness: 0.4,
        metalness: 0.7
      });
      this.breakerSwitchMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.14), rustyHandleMat);
      this.breakerSwitchMesh.position.set(0.08, 0, 0);
      this.breakerSwitchMesh.userData = { interactableType: 'floor2_breaker' };
      this.floor2BreakerLeverPivot.add(this.breakerSwitchMesh);

      const breakerHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 1.1, 0.95),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      breakerHitbox.position.set(0.35, 1.38, -20.85);
      breakerHitbox.userData = { interactableType: 'floor2_breaker' };
      this.floorTwoGroup.add(breakerHitbox);
      this.interactables.push(breakerCabinet, this.breakerSwitchMesh, breakerHitbox);

      // Angka Tercakar di Dinding Samping Kotak Sekring: "7" (Digit Pertama)
      const d7Canvas = document.createElement('canvas');
      d7Canvas.width = 256;
      d7Canvas.height = 256;
      const d7ctx = d7Canvas.getContext('2d');
      d7ctx.fillStyle = '#18221d';
      d7ctx.fillRect(0, 0, 256, 256);
      // Goresan cakaran merah darah / karat
      d7ctx.strokeStyle = '#dc2626';
      d7ctx.lineWidth = 18;
      d7ctx.lineCap = 'round';
      d7ctx.beginPath();
      d7ctx.moveTo(58, 52);
      d7ctx.lineTo(198, 52);
      d7ctx.lineTo(104, 214);
      d7ctx.stroke();
      d7ctx.fillStyle = '#fca5a5';
      d7ctx.font = 'bold 22px "Share Tech Mono", monospace';
      d7ctx.textAlign = 'center';
      d7ctx.fillText('DIGIT I : [ 7 ]', 128, 242);

      const d7Tex = new THREE.CanvasTexture(d7Canvas);
      const digit7WallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.68, 0.68),
        new THREE.MeshStandardMaterial({
          map: d7Tex,
          emissive: 0x450a0a,
          emissiveMap: d7Tex,
          emissiveIntensity: 0.85
        })
      );
      digit7WallMesh.position.set(0.14, 1.42, -19.85);
      digit7WallMesh.userData = { interactableType: 'wall_digit_7' };
      this.floorTwoGroup.add(digit7WallMesh);
      this.interactables.push(digit7WallMesh);

      const r203Light = new THREE.PointLight(0xff7744, 0.85, 6.5, 2);
      r203Light.position.set(1.5, 2.35, -20.5);
      this.floorTwoGroup.add(r203Light);

      // ====================================================================
      // F. UJIAN PANTULAN AIR (WATER REFLECTION HAZARD) DI KORIDOR UTARA (x = 13.5, z = -23.1)
      // ====================================================================
      this.floor2ReflectionEntity = createShadowRedEyesEntity(THREE);
      this.floor2ReflectionEntity.position.set(13.5, 0, -23.1);
      this.floor2ReflectionEntity.rotation.y = -Math.PI / 2;
      this.floorTwoGroup.add(this.floor2ReflectionEntity);

      // Pantulan Sepasang Mata Merah di Permukaan Genangan Air di Depan Entitas
      this.waterReflectionEyesGroup = new THREE.Group();
      this.waterReflectionEyesGroup.position.set(12.2, 0.085, -23.1);
      this.floorTwoGroup.add(this.waterReflectionEyesGroup);

      const reflEyeMat = new THREE.MeshBasicMaterial({
        color: 0xff1111,
        transparent: true,
        opacity: 0.92
      });
      const reflLeft = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), reflEyeMat);
      reflLeft.rotation.x = -Math.PI / 2;
      reflLeft.position.set(0, 0, -0.08);
      this.waterReflectionEyesGroup.add(reflLeft);

      const reflRight = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), reflEyeMat);
      reflRight.rotation.x = -Math.PI / 2;
      reflRight.position.set(0, 0, 0.08);
      this.waterReflectionEyesGroup.add(reflRight);

      const reflRippleGlow = new THREE.PointLight(0xff0000, 1.4, 3.5, 1.8);
      reflRippleGlow.position.set(0, 0.12, 0);
      this.waterReflectionEyesGroup.add(reflRippleGlow);

      // ====================================================================
      // G. KAMAR 205 (GUDANG SERVIS & DUA DIGIT TERAKHIR: "4 - 2")
      //    Koordinat: x = 16.4 s/d 21.2, z = -24.5 s/d -28.6
      // ====================================================================
      addF2Wall(4.8, 3.1, 0.22, 18.8, 1.55, -28.6); // Dinding Utara Gudang 205
      addF2Wall(0.22, 3.1, 4.1, 16.4, 1.55, -26.55); // Dinding Barat Gudang 205
      addF2Wall(0.22, 3.1, 4.1, 21.2, 1.55, -26.55); // Dinding Timur Gudang 205
      addF2Wall(1.6, 3.1, 0.22, 17.2, 1.55, -24.5);  // Dinding Selatan Kiri Pintu 205
      addF2Wall(2.0, 3.1, 0.22, 20.2, 1.55, -24.5);  // Dinding Selatan Kanan Pintu 205

      this._createRoomNumberPlateForGroup(this.floorTwoGroup, '205', 17.75, 1.62, -24.36, 0);

      // Rak Gudang Servis & Papan Memo Inventaris bertuliskan "4 - 2"
      const storageRack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.9, 0.6), this.ductMetalMat);
      storageRack.position.set(17.3, 0.95, -27.2);
      this.floorTwoGroup.add(storageRack);

      const m205Canvas = document.createElement('canvas');
      m205Canvas.width = 512;
      m205Canvas.height = 320;
      const ctx205 = m205Canvas.getContext('2d');
      ctx205.fillStyle = '#f5f5dc';
      ctx205.fillRect(0, 0, 512, 320);
      ctx205.strokeStyle = '#334155';
      ctx205.lineWidth = 10;
      ctx205.strokeRect(8, 8, 496, 304);
      ctx205.fillStyle = '#0f172a';
      ctx205.font = 'bold 26px "Share Tech Mono", monospace';
      ctx205.textAlign = 'center';
      ctx205.fillText('MEMO INVENTARIS GUDANG 205', 256, 56);
      ctx205.fillStyle = '#475569';
      ctx205.font = '20px "Share Tech Mono", monospace';
      ctx205.fillText('GEMBOK TANGGA DARURAT LT.2 (DIGIT 2 & 3):', 256, 108);
      ctx205.fillStyle = '#b91c1c';
      ctx205.font = 'bold 92px "Share Tech Mono", monospace';
      ctx205.fillText('4 - 2', 256, 212);
      ctx205.fillStyle = '#15803d';
      ctx205.font = 'bold 24px "Share Tech Mono", monospace';
      ctx205.fillText('KODE LENGKAP: [ 7 - 4 - 2 ]', 256, 278);

      const m205Tex = new THREE.CanvasTexture(m205Canvas);
      const room205BoardMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.72, 0.04),
        new THREE.MeshStandardMaterial({
          map: m205Tex,
          emissive: 0x2a2618,
          emissiveMap: m205Tex,
          emissiveIntensity: 0.75
        })
      );
      room205BoardMesh.position.set(18.8, 1.48, -28.42);
      room205BoardMesh.userData = { interactableType: 'room205_memo' };
      this.floorTwoGroup.add(room205BoardMesh);

      const m205Hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.4, 0.85),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      m205Hitbox.position.set(18.8, 1.4, -28.15);
      m205Hitbox.userData = { interactableType: 'room205_memo' };
      this.floorTwoGroup.add(m205Hitbox);
      this.interactables.push(room205BoardMesh, m205Hitbox);

      const r205Light = new THREE.PointLight(0xa3e635, 0.9, 6.5, 2);
      r205Light.position.set(18.8, 2.45, -26.8);
      this.floorTwoGroup.add(r205Light);

      // Entitas Pengejar Air (Water Dash Chase Entity) saat Gembok 7-4-2 Terbuka
      this.floor2ChaseEntity = createShadowRedEyesEntity(THREE);
      this.floor2ChaseEntity.position.set(12.5, 0, -11.1);
      this.floor2ChaseEntity.visible = false;
      this.floorTwoGroup.add(this.floor2ChaseEntity);

      // Bangun Tangga Darurat Menurun Lantai 2 -> Lantai 1 & Koridor Staf Lantai 1 (Radio HT Maya & Dhafir)
      this._buildFloorOneStairwellAndStaffCorridor();
    }

    /**
     * Membangun:
     * 1. Tangga Darurat Menurun dari Bordes Lantai 2 (z = -9.7, y = 0.0m) menuju Lantai 1 (z = -1.3, y = -4.2m)
     * 2. Bordes Bawah Tangga & Pintu Keluar Darurat berlabel "Lantai 1 - Area Staf" (x = 1.9, y = -4.2m, z = +1.5)
     * 3. Koridor Staf Lantai Dasar yang kering, bernuansa dingin, berlampu neon remang (z = +1.5 s/d +17.5, y = -4.2m)
     * 4. Meja Pos Keamanan Kecil, Loker Inventaris, & Unit Radio HT (radioHTMesh) dengan LED indikator berkedip
     * 5. Pintu Double-Door di ujung koridor staf (z = +17.5) menuju Ruang Kontrol Keamanan / Koridor Lobi Lantai 1
     */
    _buildFloorOneStairwellAndStaffCorridor() {
      const THREE = window.THREE;

      const stairTreadMat = new THREE.MeshStandardMaterial({
        color: 0x283038,
        roughness: 0.68,
        metalness: 0.25
      });
      const stairRiserMat = new THREE.MeshStandardMaterial({
        color: 0x181d22,
        roughness: 0.82,
        metalness: 0.15
      });
      const safetyNosingMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        emissive: 0x3b1d04,
        emissiveIntensity: 0.45,
        roughness: 0.4
      });
      const shaftWallMat = new THREE.MeshStandardMaterial({
        map: this.corridorWallMat.map,
        color: 0x1e252d,
        roughness: 0.76,
        metalness: 0.12
      });
      const coldDryFloorMat = new THREE.MeshStandardMaterial({
        map: this.corridorFloorMat.map,
        color: 0x1c232b,
        roughness: 0.62,
        metalness: 0.14,
        side: THREE.DoubleSide
      });
      const coldStaffWallMat = new THREE.MeshStandardMaterial({
        map: this.corridorWallMat.map,
        color: 0x1f2733,
        roughness: 0.72,
        metalness: 0.14
      });
      const coldStaffCeilMat = new THREE.MeshStandardMaterial({
        color: 0x131820,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x323942,
        roughness: 0.42,
        metalness: 0.78
      });

      // ====================================================================
      // 1. TANGGA DARURAT LANTAI 2 -> LANTAI 1 (x = 1.9, z = -9.7 s/d -1.3, y = 0.0m s/d -4.2m)
      // ====================================================================
      const stepCount = 21;
      const stairWidth = 1.76;
      for (let i = 0; i < stepCount; i++) {
        const sz = -9.7 + (i + 0.5) * 0.4;
        const sy = -((i + 1) / stepCount) * 4.2;

        const tread = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.05, 0.42), stairTreadMat);
        tread.position.set(1.9, sy - 0.025, sz);
        tread.receiveShadow = true;
        this.floorTwoGroup.add(tread);

        const nosing = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.028, 0.045), safetyNosingMat);
        nosing.position.set(1.9, sy - 0.01, sz + 0.19);
        this.floorTwoGroup.add(nosing);

        const riser = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.21, 0.04), stairRiserMat);
        riser.position.set(1.9, sy + 0.10, sz - 0.19);
        this.floorTwoGroup.add(riser);
      }

      // Pegangan Besi (Handrail) Kiri & Kanan Tangga Darurat
      [-0.82, 0.82].forEach((offsetX) => {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 9.4, 8), steelMat);
        rail.rotation.x = Math.PI / 2 + 0.46;
        rail.position.set(1.9 + offsetX, -1.25, -5.5);
        this.floorTwoGroup.add(rail);
      });

      // Dinding Kiri & Kanan Terowongan Tangga Darurat (x = 0.92 dan x = 2.88, z = -9.7 s/d +1.5)
      const shaftWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 7.8, 11.4), shaftWallMat);
      shaftWallLeft.position.set(0.92, -0.8, -4.1);
      this.floorTwoGroup.add(shaftWallLeft);

      const shaftWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 7.8, 11.4), shaftWallMat);
      shaftWallRight.position.set(2.88, -0.8, -4.1);
      this.floorTwoGroup.add(shaftWallRight);

      const shaftCeiling = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 11.4), coldStaffCeilMat);
      shaftCeiling.position.set(1.9, 2.95, -4.1);
      this.floorTwoGroup.add(shaftCeiling);

      // Lampu Dinding Tangga Darurat menuju Lantai 1
      const stairMidLight = new THREE.PointLight(0xffaa55, 0.9, 9.0, 2);
      stairMidLight.position.set(1.9, -0.6, -5.2);
      this.floorTwoGroup.add(stairMidLight);

      // Bordes Bawah Tangga Darurat Lantai 1 (x = 0.9..2.9, z = -1.3 s/d +1.5, y = -4.2m)
      const lowerLandingFloor = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 3.0), coldDryFloorMat);
      lowerLandingFloor.position.set(1.9, -4.26, 0.1);
      lowerLandingFloor.receiveShadow = true;
      this.floorTwoGroup.add(lowerLandingFloor);

      const lowerLandingLight = new THREE.PointLight(0x88ccff, 0.95, 7.5, 2);
      lowerLandingLight.position.set(1.9, -1.65, 0.6);
      this.floorTwoGroup.add(lowerLandingLight);

      // ====================================================================
      // 2. PINTU KELUAR DARURAT BERLABEL "Lantai 1 - Area Staf" (x = 1.9, y = -4.2m, z = +1.5)
      // ====================================================================
      const f1DoorWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.2, 0.22), shaftWallMat);
      f1DoorWallLeft.position.set(1.12, -2.6, 1.5);
      this.floorTwoGroup.add(f1DoorWallLeft);

      const f1DoorWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.2, 0.22), shaftWallMat);
      f1DoorWallRight.position.set(2.68, -2.6, 1.5);
      this.floorTwoGroup.add(f1DoorWallRight);

      const f1DoorWallHeader = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 0.22), shaftWallMat);
      f1DoorWallHeader.position.set(1.9, -1.48, 1.5);
      this.floorTwoGroup.add(f1DoorWallHeader);

      // Pelat Label Pintu "Lantai 1 - Area Staf"
      const f1SignCanvas = document.createElement('canvas');
      f1SignCanvas.width = 512;
      f1SignCanvas.height = 160;
      const f1ctx = f1SignCanvas.getContext('2d');
      f1ctx.fillStyle = '#0f172a';
      f1ctx.fillRect(0, 0, 512, 160);
      f1ctx.strokeStyle = '#38bdf8';
      f1ctx.lineWidth = 8;
      f1ctx.strokeRect(8, 8, 496, 144);
      f1ctx.fillStyle = '#f8fafc';
      f1ctx.font = 'bold 34px "Share Tech Mono", monospace';
      f1ctx.textAlign = 'center';
      f1ctx.fillText('Lantai 1 - Area Staf', 256, 70);
      f1ctx.fillStyle = '#7dd3fc';
      f1ctx.font = 'bold 22px "Share Tech Mono", monospace';
      f1ctx.fillText('GROUND FLOOR // STAFF CORRIDOR', 256, 118);

      const f1SignTex = new THREE.CanvasTexture(f1SignCanvas);
      const f1SignMat = new THREE.MeshStandardMaterial({
        map: f1SignTex,
        emissive: 0x0c2d48,
        emissiveMap: f1SignTex,
        emissiveIntensity: 0.85,
        roughness: 0.3
      });

      const f1HeaderSignMesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.28, 0.04), f1SignMat);
      f1HeaderSignMesh.position.set(1.9, -1.72, 1.38);
      f1HeaderSignMesh.rotation.y = Math.PI;
      this.floorTwoGroup.add(f1HeaderSignMesh);

      this.floor1StairExitDoorPivot = new THREE.Group();
      this.floor1StairExitDoorPivot.position.set(1.34, -4.2, 1.5);
      this.floorTwoGroup.add(this.floor1StairExitDoorPivot);

      const f1ExitDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.12, 2.22, 0.07), steelMat);
      f1ExitDoorMesh.position.set(0.56, 1.11, 0);
      f1ExitDoorMesh.castShadow = true;
      f1ExitDoorMesh.userData = { interactableType: 'floor1_stair_exit_door' };
      this.floor1StairExitDoorPivot.add(f1ExitDoorMesh);

      const f1DoorPlateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.24, 0.02), f1SignMat);
      f1DoorPlateMesh.position.set(0.56, 1.48, -0.045);
      f1DoorPlateMesh.rotation.y = Math.PI;
      f1DoorPlateMesh.userData = { interactableType: 'floor1_stair_exit_door' };
      this.floor1StairExitDoorPivot.add(f1DoorPlateMesh);

      const f1DoorPushBar = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.06, 0.06), safetyNosingMat);
      f1DoorPushBar.position.set(0.56, 1.02, -0.055);
      f1DoorPushBar.userData = { interactableType: 'floor1_stair_exit_door' };
      this.floor1StairExitDoorPivot.add(f1DoorPushBar);

      const f1DoorHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 2.3, 0.65),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      f1DoorHitbox.position.set(0.56, 1.15, 0);
      f1DoorHitbox.userData = { interactableType: 'floor1_stair_exit_door' };
      this.floor1StairExitDoorPivot.add(f1DoorHitbox);

      this.interactables.push(f1ExitDoorMesh, f1DoorPlateMesh, f1DoorPushBar, f1DoorHitbox);

      // ====================================================================
      // 3. KORIDOR STAF LANTAI 1 (KERING, DINGIN, BERLAMPU NEON REMANG, SUNYI MENCEKAM)
      //    Koordinat: x = 0.4 s/d 3.4 (lebar 3.0m), z = +1.5 s/d +17.5 (panjang 16.0m), y = -4.2m
      // ====================================================================
      const f1StaffFloor = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 16.2), coldDryFloorMat);
      f1StaffFloor.position.set(1.9, -4.26, 9.5);
      f1StaffFloor.receiveShadow = true;
      this.floorTwoGroup.add(f1StaffFloor);

      const f1StaffCeiling = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 16.2), coldStaffCeilMat);
      f1StaffCeiling.position.set(1.9, -0.96, 9.5);
      this.floorTwoGroup.add(f1StaffCeiling);

      const f1StaffWallWest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.3, 16.2), coldStaffWallMat);
      f1StaffWallWest.position.set(0.4, -2.55, 9.5);
      f1StaffWallWest.receiveShadow = true;
      this.floorTwoGroup.add(f1StaffWallWest);

      const f1StaffWallEast = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.3, 16.2), coldStaffWallMat);
      f1StaffWallEast.position.set(3.4, -2.55, 9.5);
      f1StaffWallEast.receiveShadow = true;
      this.floorTwoGroup.add(f1StaffWallEast);

      // Lis Dinding Biru-Abu Dingin (Dado Rail) di Koridor Staf Lantai 1
      const dadoMat = new THREE.MeshStandardMaterial({
        color: 0x2b3d4f,
        roughness: 0.55,
        metalness: 0.25
      });
      const dadoWest = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 16.0), dadoMat);
      dadoWest.position.set(0.51, -3.1, 9.5);
      this.floorTwoGroup.add(dadoWest);

      const dadoEast = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 16.0), dadoMat);
      dadoEast.position.set(3.29, -3.1, 9.5);
      this.floorTwoGroup.add(dadoEast);

      // Lampu Tabung Neon Dingin Remang di Plafon Koridor Staf Lantai 1
      [4.2, 9.5, 14.8].forEach((lz, idx) => {
        const neonMat = new THREE.MeshStandardMaterial({
          color: 0xdbeafe,
          emissive: 0x7dd3fc,
          emissiveIntensity: 0.55,
          roughness: 0.2
        });
        const tube = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 1.25), neonMat);
        tube.position.set(1.9, -1.04, lz);
        this.floorTwoGroup.add(tube);

        const pt = new THREE.PointLight(0x93c5fd, 0.68, 8.5, 2);
        pt.position.set(1.9, -1.18, lz);
        this.floorTwoGroup.add(pt);
        this.floor1StaffNeonLights.push({ light: pt, mat: neonMat, phase: idx * 2.1 });
      });

      // ====================================================================
      // 4. LOKER INVENTARIS & MEJA POS KEAMANAN + RADIO HT (radioHTMesh)
      //    Posisi Meja Keamanan: x = 0.95, y = -4.2m, z = +7.8
      // ====================================================================
      // Loker Inventaris Besi 3 Pintu di Samping Meja Keamanan (x = 0.78, y = -4.2m, z = +5.8)
      const lockerGroup = new THREE.Group();
      lockerGroup.position.set(0.78, -4.2, 5.8);
      const lockerBody = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.92, 1.35), steelMat);
      lockerBody.position.set(0, 0.96, 0);
      lockerBody.castShadow = true;
      lockerGroup.add(lockerBody);
      [-0.42, 0, 0.42].forEach((dz) => {
        const seam = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 1.76, 0.38),
          new THREE.MeshStandardMaterial({ color: 0x242b33, roughness: 0.5, metalness: 0.8 })
        );
        seam.position.set(0.265, 0.98, dz);
        lockerGroup.add(seam);
      });
      this.floorTwoGroup.add(lockerGroup);

      // Meja Pos Keamanan Kecil di Samping Koridor (x = 0.98, y = -4.2m, z = +7.8)
      const securityDeskGroup = new THREE.Group();
      securityDeskGroup.position.set(0.98, -4.2, 7.8);

      const sDeskTop = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.06, 1.45), this.darkWoodMat);
      sDeskTop.position.set(0, 0.76, 0);
      sDeskTop.castShadow = true;
      sDeskTop.receiveShadow = true;
      sDeskTop.userData = { interactableType: 'radio_ht' };
      securityDeskGroup.add(sDeskTop);

      const sDeskPanel = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.74, 1.38), steelMat);
      sDeskPanel.position.set(-0.02, 0.37, 0);
      sDeskPanel.castShadow = true;
      securityDeskGroup.add(sDeskPanel);

      this.floorTwoGroup.add(securityDeskGroup);

      // Lampu Meja Kecil di Pos Keamanan agar Radio HT tampak jelas
      const deskLampLight = new THREE.PointLight(0xbae6fd, 0.82, 4.5, 2);
      deskLampLight.position.set(1.05, -3.05, 7.8);
      this.floorTwoGroup.add(deskLampLight);

      // Unit Radio Handy Talkie (this.radioHTMesh) di Atas Meja Keamanan (x = 1.08, y = -3.41m, z = +7.8)
      this.radioHTMesh = new THREE.Group();
      this.radioHTMesh.position.set(1.08, -3.41, 7.8);
      this.radioHTMesh.rotation.y = 0.45;

      const htBodyMat = new THREE.MeshStandardMaterial({
        color: 0x11151c,
        roughness: 0.45,
        metalness: 0.65
      });
      const htBody = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.21, 0.055), htBodyMat);
      htBody.position.set(0, 0.105, 0);
      htBody.castShadow = true;
      htBody.userData = { interactableType: 'radio_ht' };
      this.radioHTMesh.add(htBody);

      // Antena Vertikal Radio HT
      const htAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.011, 0.19, 10), htBodyMat);
      htAntenna.position.set(-0.026, 0.29, 0);
      htAntenna.userData = { interactableType: 'radio_ht' };
      this.radioHTMesh.add(htAntenna);

      // Layar Frekuensi LCD Kecil pada Radio HT ("CH-04")
      const lcdMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const htLcd = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.036), lcdMat);
      htLcd.position.set(0, 0.145, 0.029);
      htLcd.userData = { interactableType: 'radio_ht' };
      this.radioHTMesh.add(htLcd);

      // Lampu LED Indikator pada Radio HT (Hijau berkedip pelan, lalu Hijau-Merah cepat saat memanggil)
      this.radioLEDMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      this.radioLEDMesh = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 12), this.radioLEDMat);
      this.radioLEDMesh.position.set(0.026, 0.215, 0.018);
      this.radioLEDMesh.userData = { interactableType: 'radio_ht' };
      this.radioHTMesh.add(this.radioLEDMesh);

      this.radioLEDLight = new THREE.PointLight(0x22c55e, 1.15, 2.8, 1.8);
      this.radioLEDLight.position.set(0.026, 0.24, 0.04);
      this.radioHTMesh.add(this.radioLEDLight);

      // Hitbox Raycaster Radio HT agar mudah diarahkan dari jarak interaksi
      const radioHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.95, 1.15),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      radioHitbox.position.set(0, 0.22, 0);
      radioHitbox.userData = { interactableType: 'radio_ht' };
      this.radioHTMesh.add(radioHitbox);

      this.floorTwoGroup.add(this.radioHTMesh);
      this.interactables.push(sDeskTop, htBody, htAntenna, htLcd, this.radioLEDMesh, radioHitbox);

      // ====================================================================
      // 5. PINTU DOUBLE-DOOR DI UJUNG KORIDOR STAF (x = 1.9, y = -4.2m, z = +17.5)
      //    Menuju Ruang Kontrol Keamanan / Koridor Lobi Lantai 1 (z = +17.5 s/d +23.5)
      // ====================================================================
      const ddWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.3, 0.22), coldStaffWallMat);
      ddWallLeft.position.set(0.725, -2.55, 17.5);
      this.floorTwoGroup.add(ddWallLeft);

      const ddWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.3, 0.22), coldStaffWallMat);
      ddWallRight.position.set(3.075, -2.55, 17.5);
      this.floorTwoGroup.add(ddWallRight);

      const ddWallHeader = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.95, 0.22), coldStaffWallMat);
      ddWallHeader.position.set(1.9, -1.38, 17.5);
      this.floorTwoGroup.add(ddWallHeader);

      // Indikator Kunci Magnetik di Atas Double-Door (Merah saat Terkunci, Hijau setelah Dialog Dhafir)
      this.floor1DoubleDoorLockMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const ddLockLamp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.05), this.floor1DoubleDoorLockMat);
      ddLockLamp.position.set(1.9, -1.78, 17.38);
      this.floorTwoGroup.add(ddLockLamp);

      this.floor1DoubleDoorLockLight = new THREE.PointLight(0xef4444, 1.1, 4.5, 2);
      this.floor1DoubleDoorLockLight.position.set(1.9, -1.82, 17.25);
      this.floorTwoGroup.add(this.floor1DoubleDoorLockLight);

      this.floor1DoubleDoorLeftPivot = new THREE.Group();
      this.floor1DoubleDoorLeftPivot.position.set(1.05, -4.2, 17.5);
      this.floorTwoGroup.add(this.floor1DoubleDoorLeftPivot);

      const ddLeftLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.84, 2.28, 0.07), steelMat);
      ddLeftLeaf.position.set(0.42, 1.14, 0);
      ddLeftLeaf.userData = { interactableType: 'floor1_double_door' };
      this.floor1DoubleDoorLeftPivot.add(ddLeftLeaf);

      this.floor1DoubleDoorRightPivot = new THREE.Group();
      this.floor1DoubleDoorRightPivot.position.set(2.75, -4.2, 17.5);
      this.floorTwoGroup.add(this.floor1DoubleDoorRightPivot);

      const ddRightLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.84, 2.28, 0.07), steelMat);
      ddRightLeaf.position.set(-0.42, 1.14, 0);
      ddRightLeaf.userData = { interactableType: 'floor1_double_door' };
      this.floor1DoubleDoorRightPivot.add(ddRightLeaf);

      const ddHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, 2.35, 0.65),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      ddHitbox.position.set(1.9, -3.05, 17.5);
      ddHitbox.userData = { interactableType: 'floor1_double_door' };
      this.floorTwoGroup.add(ddHitbox);

      this.interactables.push(ddLeftLeaf, ddRightLeaf, ddHitbox);

      // Simpan referensi doorMesh untuk status kunci magnetik pintu hidrolik Ruang Arsip
      this.archiveDoorMesh = ddLeftLeaf;
      this.archiveDoorMesh.isLocked = true;

      // Panel Kunci Elektronik yang Konslet/Mati di Samping Pintu Hidrolik (x = 1.02, y = -2.95, z = +17.65)
      const panelBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.06), steelMat);
      panelBox.position.set(0.88, -2.95, 17.65);
      panelBox.userData = { interactableType: 'archive_hydraulic_door' };
      this.floorTwoGroup.add(panelBox);

      this.archiveElectronicPanelMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
      const panelScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.09), this.archiveElectronicPanelMat);
      panelScreen.position.set(0.88, -2.90, 17.685);
      panelScreen.userData = { interactableType: 'archive_hydraulic_door' };
      this.floorTwoGroup.add(panelScreen);

      this.archiveElectronicSparkLight = new THREE.PointLight(0xff3333, 0.85, 3.2, 2);
      this.archiveElectronicSparkLight.position.set(0.88, -2.90, 17.78);
      this.floorTwoGroup.add(this.archiveElectronicSparkLight);
      this.interactables.push(panelBox, panelScreen);

      // ====================================================================
      // 6. RUANG ARSIP DARURAT LANTAI 1 (THE PANIC ARCHIVE ROOM)
      //    Koordinat: x = -1.1 s/d +4.9 (lebar 6.0m), z = +17.5 s/d +24.5 (panjang 7.0m), y = -4.2m
      // ====================================================================
      const archiveSteelWallMat = new THREE.MeshStandardMaterial({
        color: 0x161a20,
        roughness: 0.58,
        metalness: 0.62
      });
      const acousticFoamMat = new THREE.MeshStandardMaterial({
        color: 0x22262c,
        roughness: 0.96,
        metalness: 0.04
      });

      const archiveFloor = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.12, 7.2), coldDryFloorMat);
      archiveFloor.position.set(1.9, -4.26, 21.0);
      archiveFloor.receiveShadow = true;
      this.floorTwoGroup.add(archiveFloor);

      const archiveCeil = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.12, 7.2), coldStaffCeilMat);
      archiveCeil.position.set(1.9, -0.96, 21.0);
      this.floorTwoGroup.add(archiveCeil);

      // Dinding Baja Lapis Ganda Ruang Arsip (Barat x = -1.1, Timur x = +4.9, Utara Kiri-Kanan z = +17.5, Selatan Kiri-Kanan z = +24.5)
      const archNorthLeft = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.3, 0.22), archiveSteelWallMat);
      archNorthLeft.position.set(-0.3, -2.55, 17.5);
      this.floorTwoGroup.add(archNorthLeft);

      const archNorthRight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.3, 0.22), archiveSteelWallMat);
      archNorthRight.position.set(4.1, -2.55, 17.5);
      this.floorTwoGroup.add(archNorthRight);

      const archWestWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.3, 7.2), archiveSteelWallMat);
      archWestWall.position.set(-1.1, -2.55, 21.0);
      this.floorTwoGroup.add(archWestWall);

      const archEastWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.3, 7.2), archiveSteelWallMat);
      archEastWall.position.set(4.9, -2.55, 21.0);
      this.floorTwoGroup.add(archEastWall);

      // Dinding Selatan Ruang Arsip (z = +24.5) dengan Bukaan Pintu Hidrolik Keluar menuju Lobi (x = 1.25..2.55)
      const archSouthLeft = new THREE.Mesh(new THREE.BoxGeometry(2.35, 3.3, 0.24), archiveSteelWallMat);
      archSouthLeft.position.set(0.075, -2.55, 24.5);
      this.floorTwoGroup.add(archSouthLeft);

      const archSouthRight = new THREE.Mesh(new THREE.BoxGeometry(2.35, 3.3, 0.24), archiveSteelWallMat);
      archSouthRight.position.set(3.725, -2.55, 24.5);
      this.floorTwoGroup.add(archSouthRight);

      const archSouthHeader = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.95, 0.24), archiveSteelWallMat);
      archSouthHeader.position.set(1.9, -1.38, 24.5);
      this.floorTwoGroup.add(archSouthHeader);

      // Lapisan Panel Busa Peredam Suara Akustik Abu-Abu Gelap di Dinding Ruang Arsip
      for (let fz = 18.2; fz <= 23.8; fz += 0.92) {
        const foamW = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.35, 0.78), acousticFoamMat);
        foamW.position.set(-0.96, -2.55, fz);
        this.floorTwoGroup.add(foamW);

        const foamE = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.35, 0.78), acousticFoamMat);
        foamE.position.set(4.76, -2.55, fz);
        this.floorTwoGroup.add(foamE);
      }

      // Ventilasi Udara Tertutup Teralis Besi Rapat di Dinding Atas Ruang Arsip
      [-0.95, 4.75].forEach((vx) => {
        const ventFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.86), steelMat);
        ventFrame.position.set(vx, -1.38, 21.0);
        this.floorTwoGroup.add(ventFrame);
        for (let b = -0.32; b <= 0.32; b += 0.16) {
          const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.44, 8), steelMat);
          bar.position.set(vx, -1.38, 21.0 + b);
          this.floorTwoGroup.add(bar);
        }
      });

      // Jejeran Lemari Arsip Dokumen Logam Tinggi (Tall Metal Filing Cabinets)
      const cabinetMat = new THREE.MeshStandardMaterial({
        color: 0x2c343e,
        roughness: 0.48,
        metalness: 0.72
      });
      const cabinetPositions = [
        [-0.48, -4.2, 18.8, Math.PI / 2],
        [-0.48, -4.2, 20.2, Math.PI / 2],
        [-0.48, -4.2, 21.6, Math.PI / 2],
        [4.28, -4.2, 18.8, -Math.PI / 2],
        [4.28, -4.2, 20.2, -Math.PI / 2],
        // Lemari Arsip Tebal di Sudut Belakang tempat Maya berlindung saat Dhafir menembak engsel!
        [-0.25, -4.2, 23.35, 0]
      ];
      cabinetPositions.forEach(([cx, cy, cz, ry]) => {
        const cabGroup = new THREE.Group();
        cabGroup.position.set(cx, cy, cz);
        cabGroup.rotation.y = ry;
        const cabBody = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.12, 0.58), cabinetMat);
        cabBody.position.set(0, 1.06, 0);
        cabBody.castShadow = true;
        cabBody.receiveShadow = true;
        cabGroup.add(cabBody);
        for (let d = 0; d < 4; d++) {
          const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.44, 0.03), steelMat);
          drawer.position.set(0, 0.32 + d * 0.48, 0.30);
          cabGroup.add(drawer);
        }
        this.floorTwoGroup.add(cabGroup);
      });

      // Meja Kerja dengan Berkas Berserakan ("PROJECT BLINDSPOT // DR. MARK EVANS")
      const archiveDeskGroup = new THREE.Group();
      archiveDeskGroup.position.set(3.35, -4.2, 22.4);
      const aDeskTop = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.78, 0.82), this.darkWoodMat);
      aDeskTop.position.set(0, 0.39, 0);
      aDeskTop.castShadow = true;
      archiveDeskGroup.add(aDeskTop);

      const filePaperMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
      const redFolderMat = new THREE.MeshBasicMaterial({ color: 0x991b1b });
      [
        [-0.28, 0.79, -0.12, 0.25],
        [0.12, 0.795, 0.08, -0.35],
        [0.32, 0.79, -0.15, 0.12]
      ].forEach(([px, py, pz, pr], idx) => {
        const docMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.015, 0.21),
          idx === 1 ? redFolderMat : filePaperMat
        );
        docMesh.position.set(px, py, pz);
        docMesh.rotation.y = pr;
        archiveDeskGroup.add(docMesh);
      });
      this.floorTwoGroup.add(archiveDeskGroup);

      // Pencahayaan Ruang Arsip Darurat
      const archiveRoomLight = new THREE.PointLight(0x93c5fd, 0.78, 8.5, 2);
      archiveRoomLight.position.set(1.9, -1.22, 21.0);
      this.floorTwoGroup.add(archiveRoomLight);

      // ====================================================================
      // 7. PINTU HIDROLIK BAJA KELUAR RUANG ARSIP (z = +24.5) & ENGSEL CADANGAN TEREKSPOS
      // ====================================================================
      this.archiveExitDoorPivot = new THREE.Group();
      this.archiveExitDoorPivot.position.set(1.9, -4.2, 24.5);
      this.floorTwoGroup.add(this.archiveExitDoorPivot);

      this.archiveExitDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.28, 2.28, 0.10), steelMat);
      this.archiveExitDoorMesh.position.set(0, 1.14, 0);
      this.archiveExitDoorMesh.castShadow = true;
      this.archiveExitDoorMesh.userData = { interactableType: 'archive_hydraulic_door' };
      this.archiveExitDoorMesh.isLocked = true;
      this.archiveExitDoorPivot.add(this.archiveExitDoorMesh);

      // Engsel Hidrolik Cadangan yang Terekspos di Sisi Kiri-Atas & Kiri-Bawah Pintu
      const exposedHingeMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        emissive: 0x451a03,
        emissiveIntensity: 0.55,
        roughness: 0.35,
        metalness: 0.85
      });
      [0.45, 1.82].forEach((hy) => {
        const hingeCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.24, 10), exposedHingeMat);
        hingeCyl.position.set(-0.62, hy, -0.06);
        this.archiveExitDoorPivot.add(hingeCyl);
      });

      this.interactables.push(this.archiveExitDoorMesh);

      // Partikel Percikan Api & Kepulan Asap pada Engsel Pintu saat Ditembak Dhafir (Babak 7)
      const sparkCount = 28;
      const sparkPositions = new Float32Array(sparkCount * 3);
      for (let i = 0; i < sparkCount; i++) {
        sparkPositions[i * 3 + 0] = 1.28 + (Math.random() - 0.5) * 0.45;
        sparkPositions[i * 3 + 1] = -2.55 + (Math.random() - 0.5) * 1.1;
        sparkPositions[i * 3 + 2] = 24.38 + (Math.random() - 0.5) * 0.35;
      }
      const sparkGeo = new THREE.BufferGeometry();
      sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
      this.archiveHingeSparksMat = new THREE.PointsMaterial({
        color: 0xffaa22,
        size: 0.075,
        transparent: true,
        opacity: 0
      });
      this.archiveHingeSparksPoints = new THREE.Points(sparkGeo, this.archiveHingeSparksMat);
      this.floorTwoGroup.add(this.archiveHingeSparksPoints);

      this.archiveHingeSmokeGroup = new THREE.Group();
      this.archiveHingeSmokeGroup.position.set(1.35, -2.8, 24.35);
      this.archiveHingeSmokeGroup.visible = false;
      const smokePuffMat = new THREE.MeshBasicMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.42
      });
      for (let s = 0; s < 6; s++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.22 + s * 0.05, 10, 10), smokePuffMat);
        puff.position.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.4);
        this.archiveHingeSmokeGroup.add(puff);
      }
      this.floorTwoGroup.add(this.archiveHingeSmokeGroup);

      this.archiveBreachFlashLight = new THREE.PointLight(0xffaa33, 0, 7.5, 1.6);
      this.archiveBreachFlashLight.position.set(1.32, -2.55, 24.25);
      this.floorTwoGroup.add(this.archiveBreachFlashLight);

      // ====================================================================
      // 8. LORONG & ATRIUM LOBI UTAMA (MAIN LOBBY ESCAPE: z = +24.5 s/d +36.0, y = -4.2m)
      // ====================================================================
      const lobbyFloor = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.12, 12.0), coldDryFloorMat);
      lobbyFloor.position.set(1.9, -4.26, 30.5);
      lobbyFloor.receiveShadow = true;
      this.floorTwoGroup.add(lobbyFloor);

      const lobbyCeil = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.12, 12.0), coldStaffCeilMat);
      lobbyCeil.position.set(1.9, 0.25, 30.5);
      this.floorTwoGroup.add(lobbyCeil);

      const lobbyWestWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.6, 12.0), coldStaffWallMat);
      lobbyWestWall.position.set(-2.2, -1.95, 30.5);
      this.floorTwoGroup.add(lobbyWestWall);

      const lobbyEastWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.6, 12.0), coldStaffWallMat);
      lobbyEastWall.position.set(6.0, -1.95, 30.5);
      this.floorTwoGroup.add(lobbyEastWall);

      // Pintu Keluar Kaca Lobi Utama dengan Cahaya Fajar di Ujung Selatan (z = +36.2)
      const dawnGlassMat = new THREE.MeshStandardMaterial({
        color: 0x93c5fd,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.9,
        roughness: 0.15,
        metalness: 0.3
      });
      const mainExitGlassDoor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 0.12), dawnGlassMat);
      mainExitGlassDoor.position.set(1.9, -2.6, 36.2);
      mainExitGlassDoor.userData = { interactableType: 'main_lobby_glass_exit' };
      this.floorTwoGroup.add(mainExitGlassDoor);
      this.interactables.push(mainExitGlassDoor);

      const dawnExitLight = new THREE.PointLight(0x7dd3fc, 1.8, 14.0, 1.6);
      dawnExitLight.position.set(1.9, -2.1, 35.2);
      this.floorTwoGroup.add(dawnExitLight);

      // Entitas Bayangan Bermata Merah di Atrium Lobi Utama (Mekanik Fatal Gaze Tetap Aktif)
      this.floor1LobbyEntity = createShadowRedEyesEntity(THREE);
      this.floor1LobbyEntity.position.set(4.5, -4.2, 31.0);
      this.floor1LobbyEntity.visible = false;
      this.floorTwoGroup.add(this.floor1LobbyEntity);
    }

    _createRoomNumberPlateForGroup(group, roomNumberStr, x, y, z, rotY) {
      const THREE = window.THREE;
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#233028';
      ctx.fillRect(0, 0, 128, 64);
      ctx.strokeStyle = '#84a98c';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 120, 56);
      ctx.fillStyle = '#e2f1e7';
      ctx.font = 'bold 30px "Cinzel", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(roomNumberStr, 64, 34);
      const tex = new THREE.CanvasTexture(canvas);
      const plateMat = new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0x14241b,
        emissiveMap: tex,
        emissiveIntensity: 0.5
      });
      const plateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.018), plateMat);
      plateMesh.position.set(x, y, z);
      plateMesh.rotation.y = rotY;
      group.add(plateMesh);
    }

    _buildEastWingAndInteractiveDoors() {
      const THREE = window.THREE;

      const eastFloor = new THREE.Mesh(
        new THREE.BoxGeometry(11.3, 0.1, 2.9),
        this.corridorFloorMat
      );
      eastFloor.position.set(16.9, -0.05, -13.6);
      eastFloor.receiveShadow = true;
      this.scene.add(eastFloor);

      const eastCeiling = new THREE.Mesh(
        new THREE.BoxGeometry(11.3, 0.1, 2.9),
        this.corridorCeilingMat
      );
      eastCeiling.position.set(16.9, 3.05, -13.6);
      this.scene.add(eastCeiling);

      const eastNorthWall1 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.05, 0.18), this.corridorWallMat);
      eastNorthWall1.position.set(12.85, 1.5, -15.0);
      eastNorthWall1.receiveShadow = true;
      this.scene.add(eastNorthWall1);

      const room304Header = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.88, 0.18), this.corridorWallMat);
      room304Header.position.set(14.8, 2.58, -15.0);
      this.scene.add(room304Header);

      const eastNorthWall2 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.05, 0.18), this.corridorWallMat);
      eastNorthWall2.position.set(18.85, 1.5, -15.0);
      eastNorthWall2.receiveShadow = true;
      this.scene.add(eastNorthWall2);

      const eastSouthWall = new THREE.Mesh(new THREE.BoxGeometry(8.3, 3.05, 0.18), this.corridorWallMat);
      eastSouthWall.position.set(15.5, 1.5, -12.2);
      eastSouthWall.receiveShadow = true;
      this.scene.add(eastSouthWall);

      const farEastWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.05, 8.2), this.corridorWallMat);
      farEastWall.position.set(22.4, 1.5, -11.0);
      farEastWall.receiveShadow = true;
      this.scene.add(farEastWall);

      this._addBaseboard(12.85, -14.89, 2.8, 'x');
      this._addBaseboard(18.85, -14.89, 7.0, 'x');
      this._addBaseboard(15.5, -12.31, 8.1, 'x');
      this._addBaseboard(22.29, -11.0, 8.0, 'z');

      const r304JambL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.18, 0.22), this.darkWoodMat);
      r304JambL.position.set(14.3, 1.09, -15.0);
      this.scene.add(r304JambL);

      const r304JambR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.18, 0.22), this.darkWoodMat);
      r304JambR.position.set(15.3, 1.09, -15.0);
      this.scene.add(r304JambR);

      this.room304DoorPivot = new THREE.Group();
      this.room304DoorPivot.position.set(14.34, 0, -15.02);
      this.room304DoorPivot.rotation.y = 0.62;
      this.scene.add(this.room304DoorPivot);

      const r304DoorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 2.12, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x3b261a, roughness: 0.78 })
      );
      r304DoorMesh.position.set(0.46, 1.06, 0);
      r304DoorMesh.castShadow = true;
      r304DoorMesh.receiveShadow = true;
      r304DoorMesh.userData = { interactableType: 'room_304_door' };
      this.room304DoorPivot.add(r304DoorMesh);
      this.interactables.push(r304DoorMesh);

      this._createRoomNumberPlate('304', 14.02, 1.62, -14.89, 0);

      const r305Group = this._createHallwayDoorMesh(15.2, -12.29, Math.PI, 'room_305_knock', 'Kamar 305');
      this.scene.add(r305Group);
      this._createRoomNumberPlate('305', 14.48, 1.62, -12.31, Math.PI);

      this.room307DoorGroup = this._createHallwayDoorMesh(19.0, -14.91, 0, 'room_307_knock', 'Kamar 307');
      this.scene.add(this.room307DoorGroup);
      this._createRoomNumberPlate('307', 18.28, 1.62, -14.89, 0);

      const eastWingLight = new THREE.PointLight(0x9cb4c9, 0.85, 14.0, 2);
      eastWingLight.position.set(15.8, 2.82, -13.6);
      this.scene.add(eastWingLight);
    }

    _createHallwayDoorMesh(x, z, rotY, interactableType, roomLabel) {
      const THREE = window.THREE;
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      group.rotation.y = rotY;

      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.06, 2.18, 0.08), this.darkWoodMat);
      frame.position.set(0, 1.09, 0);
      group.add(frame);

      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 2.1, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x321f15, roughness: 0.82 })
      );
      panel.position.set(0, 1.06, 0.02);
      panel.castShadow = true;
      panel.receiveShadow = true;
      panel.userData = { interactableType, roomLabel };
      group.add(panel);

      this.interactables.push(panel);
      return group;
    }

    _buildRoom304Interior() {
      const THREE = window.THREE;

      const rFloor = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.1, 4.2), this.corridorFloorMat);
      rFloor.position.set(14.8, -0.05, -17.0);
      rFloor.receiveShadow = true;
      this.scene.add(rFloor);

      const rCeil = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.1, 4.2), this.corridorCeilingMat);
      rCeil.position.set(14.8, 3.05, -17.0);
      this.scene.add(rCeil);

      const rBackWall = new THREE.Mesh(new THREE.BoxGeometry(5.1, 3.05, 0.18), this.corridorWallMat);
      rBackWall.position.set(14.8, 1.5, -19.0);
      rBackWall.receiveShadow = true;
      this.scene.add(rBackWall);

      const rLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.05, 4.2), this.corridorWallMat);
      rLeftWall.position.set(12.3, 1.5, -17.0);
      rLeftWall.receiveShadow = true;
      this.scene.add(rLeftWall);

      const rRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.05, 4.2), this.corridorWallMat);
      rRightWall.position.set(17.3, 1.5, -17.0);
      rRightWall.receiveShadow = true;
      this.scene.add(rRightWall);

      this._addBaseboard(14.8, -18.89, 5.0, 'x');
      this._addBaseboard(12.41, -17.0, 4.0, 'z');
      this._addBaseboard(17.19, -17.0, 4.0, 'z');

      // Ranjang Usang di Sisi Kiri
      const oldBedGroup = new THREE.Group();
      oldBedGroup.position.set(13.15, 0, -17.1);

      const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.32, 2.05), this.darkWoodMat);
      bedFrame.position.set(0, 0.16, 0);
      bedFrame.castShadow = true;
      bedFrame.receiveShadow = true;
      oldBedGroup.add(bedFrame);

      const bedHeadboard = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.92, 0.1), this.darkWoodMat);
      bedHeadboard.position.set(0, 0.46, -0.98);
      bedHeadboard.rotation.z = -0.04;
      oldBedGroup.add(bedHeadboard);

      const tornMattressMat = new THREE.MeshStandardMaterial({
        color: 0x48403c,
        roughness: 0.94,
        metalness: 0.02
      });
      const tornMattress = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.2, 1.92), tornMattressMat);
      tornMattress.position.set(0.03, 0.40, 0.02);
      tornMattress.rotation.z = 0.03;
      tornMattress.castShadow = true;
      oldBedGroup.add(tornMattress);

      const foamTear = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.06, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x7a6842, roughness: 0.96 })
      );
      foamTear.position.set(0.15, 0.50, 0.2);
      foamTear.rotation.y = 0.4;
      oldBedGroup.add(foamTear);

      this.scene.add(oldBedGroup);

      // Meja Kerja Kayu Reyot & Cermin Retak di Sudut Depan
      const deskGroup = new THREE.Group();
      deskGroup.position.set(15.85, 0, -18.35);

      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.07, 0.74), this.darkWoodMat);
      deskTop.position.set(0, 0.76, 0);
      deskTop.rotation.z = -0.015;
      deskTop.castShadow = true;
      deskTop.receiveShadow = true;
      deskGroup.add(deskTop);

      const legGeo = new THREE.BoxGeometry(0.07, 0.75, 0.07);
      [
        [-0.58, 0.375, -0.28],
        [0.58, 0.375, -0.28],
        [-0.58, 0.375, 0.28],
        [0.58, 0.375, 0.28]
      ].forEach(([lx, ly, lz], idx) => {
        const leg = new THREE.Mesh(legGeo, this.darkWoodMat);
        leg.position.set(lx, ly, lz);
        if (idx === 2) leg.rotation.z = 0.05;
        deskGroup.add(leg);
      });

      this.scene.add(deskGroup);

      const mirrorTex = this._createCrackedMirrorTexture();
      const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.15, 0.05), this.darkWoodMat);
      mirrorFrame.position.set(15.85, 1.52, -18.88);
      this.scene.add(mirrorFrame);

      const mirrorGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(0.84, 1.02),
        new THREE.MeshStandardMaterial({
          map: mirrorTex,
          roughness: 0.22,
          metalness: 0.86
        })
      );
      mirrorGlass.position.set(15.85, 1.52, -18.85);
      this.scene.add(mirrorGlass);

      // Tumpukan Kardus Basah & Sampah
      const wetCardboardMat = new THREE.MeshStandardMaterial({
        color: 0x4a3828,
        roughness: 0.92,
        metalness: 0.02
      });
      const trashBagMat = new THREE.MeshStandardMaterial({
        color: 0x16181c,
        roughness: 0.48,
        metalness: 0.25
      });

      const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.5), wetCardboardMat);
      box1.position.set(16.65, 0.21, -15.65);
      box1.rotation.y = 0.35;
      box1.castShadow = true;
      this.scene.add(box1);

      const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.34, 0.42), wetCardboardMat);
      box2.position.set(16.58, 0.58, -15.72);
      box2.rotation.set(0.08, -0.5, 0.12);
      box2.castShadow = true;
      this.scene.add(box2);

      const trashBag1 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), trashBagMat);
      trashBag1.scale.set(1.1, 0.85, 1.0);
      trashBag1.position.set(16.25, 0.22, -15.55);
      this.scene.add(trashBag1);

      const trashBag2 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), trashBagMat);
      trashBag2.scale.set(1.0, 0.78, 1.15);
      trashBag2.position.set(12.85, 0.19, -15.55);
      this.scene.add(trashBag2);

      // Kunci Ruang Panel 3B / Maintenance 3B (stairwellKeyMesh) + Label Tag di Atas Meja Kerja
      this.stairwellKeyMesh = new THREE.Group();
      this.stairwellKeyMesh.position.set(15.85, 0.815, -18.22);
      this.stairwellKeyMesh.rotation.y = -0.55;

      const keyMetalMat = new THREE.MeshStandardMaterial({
        color: 0xd8c26c,
        emissive: 0x443510,
        emissiveIntensity: 0.55,
        roughness: 0.2,
        metalness: 0.94
      });

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.18, 12), keyMetalMat);
      shaft.rotation.z = Math.PI / 2;
      shaft.userData = { interactableType: 'stairwell_key' };
      this.stairwellKeyMesh.add(shaft);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.01, 10, 18), keyMetalMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(-0.10, 0, 0);
      ring.userData = { interactableType: 'stairwell_key' };
      this.stairwellKeyMesh.add(ring);

      // Gantungan Tag Kunci "PANEL 3B"
      const keyTag = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.008, 0.032),
        new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 })
      );
      keyTag.position.set(-0.15, 0, 0.01);
      keyTag.userData = { interactableType: 'stairwell_key' };
      this.stairwellKeyMesh.add(keyTag);

      const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.012, 0.042), keyMetalMat);
      teeth.position.set(0.06, 0, 0.022);
      teeth.userData = { interactableType: 'stairwell_key' };
      this.stairwellKeyMesh.add(teeth);

      const keyHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.24, 0.34),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      keyHitbox.userData = { interactableType: 'stairwell_key' };
      this.stairwellKeyMesh.add(keyHitbox);

      const glintCount = 14;
      const glintPositions = new Float32Array(glintCount * 3);
      for (let i = 0; i < glintCount; i++) {
        glintPositions[i * 3 + 0] = (Math.random() - 0.5) * 0.22;
        glintPositions[i * 3 + 1] = 0.02 + Math.random() * 0.14;
        glintPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.22;
      }
      const glintGeo = new THREE.BufferGeometry();
      glintGeo.setAttribute('position', new THREE.BufferAttribute(glintPositions, 3));
      this.keyGlintMat = new THREE.PointsMaterial({
        color: 0xfff4b8,
        size: 0.032,
        transparent: true,
        opacity: 0.65
      });
      this.keyGlintPoints = new THREE.Points(glintGeo, this.keyGlintMat);
      this.stairwellKeyMesh.add(this.keyGlintPoints);

      this.scene.add(this.stairwellKeyMesh);
      this.interactables.push(shaft, ring, keyTag, teeth, keyHitbox);

      // Wujud Baru Entitas di Kamar 304: Bayangan Hitam Pekat dengan Sepasang Mata Merah Menyala
      this.roomEntityMesh = createShadowRedEyesEntity(THREE);
      this.roomEntityMesh.position.set(14.85, 0, -16.25);
      this.roomEntityHeadWorldPos = new THREE.Vector3(14.85, 2.06, -16.25);
      this.roomEntityMesh.visible = false;
      this.scene.add(this.roomEntityMesh);

      const r304Light = new THREE.PointLight(0xd99b66, 0.68, 8.5, 2);
      r304Light.position.set(14.8, 2.75, -17.2);
      this.scene.add(r304Light);
    }

    _createCrackedMirrorTexture() {
      const THREE = window.THREE;
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 256, 256);
      grad.addColorStop(0, '#1e2630');
      grad.addColorStop(0.5, '#2b3542');
      grad.addColorStop(1, '#12171d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = 'rgba(210, 225, 240, 0.65)';
      ctx.lineWidth = 1.8;
      const cx = 148;
      const cy = 112;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 7) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const mx = cx + Math.cos(a) * 60 + (Math.random() - 0.5) * 18;
        const my = cy + Math.sin(a) * 60 + (Math.random() - 0.5) * 18;
        ctx.lineTo(mx, my);
        ctx.lineTo(cx + Math.cos(a + 0.1) * 145, cy + Math.sin(a + 0.1) * 145);
        ctx.stroke();
      }
      return new THREE.CanvasTexture(c);
    }

    _buildBarricadedStairwell() {
      const THREE = window.THREE;

      const stairFloor = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.1, 5.4), this.corridorFloorMat);
      stairFloor.position.set(21.0, -0.05, -9.6);
      stairFloor.receiveShadow = true;
      this.scene.add(stairFloor);

      const stairCeil = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.1, 5.4), this.corridorCeilingMat);
      stairCeil.position.set(21.0, 3.05, -9.6);
      this.scene.add(stairCeil);

      const stairWestWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.05, 5.4), this.corridorWallMat);
      stairWestWall.position.set(19.6, 1.5, -9.6);
      stairWestWall.receiveShadow = true;
      this.scene.add(stairWestWall);

      const stairSouthWall = new THREE.Mesh(new THREE.BoxGeometry(2.9, 3.05, 0.18), this.corridorWallMat);
      stairSouthWall.position.set(21.0, 1.5, -7.0);
      this.scene.add(stairSouthWall);

      this._addBaseboard(19.71, -9.6, 5.2, 'z');

      const barricadeGroup = new THREE.Group();
      barricadeGroup.position.set(21.0, 0, -8.8);

      const tornMattress = new THREE.Mesh(
        new THREE.BoxGeometry(1.55, 1.85, 0.24),
        new THREE.MeshStandardMaterial({ color: 0x524642, roughness: 0.92 })
      );
      tornMattress.position.set(-0.35, 0.9, 0.1);
      tornMattress.rotation.set(-0.22, 0.18, 0.12);
      tornMattress.castShadow = true;
      tornMattress.userData = { interactableType: 'barricaded_stairs' };
      barricadeGroup.add(tornMattress);

      const bloodPatch = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.86, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x450606, roughness: 0.7 })
      );
      bloodPatch.position.set(-0.28, 0.85, 0.12);
      bloodPatch.rotation.set(-0.22, 0.18, 0.12);
      bloodPatch.userData = { interactableType: 'barricaded_stairs' };
      barricadeGroup.add(bloodPatch);

      const tiltedWardrobe = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.82, 0.75), this.darkWoodMat);
      tiltedWardrobe.position.set(0.25, 0.45, -0.15);
      tiltedWardrobe.rotation.set(0.1, -0.25, 0.28);
      tiltedWardrobe.castShadow = true;
      tiltedWardrobe.userData = { interactableType: 'barricaded_stairs' };
      barricadeGroup.add(tiltedWardrobe);

      for (let i = 0; i < 4; i++) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.14, 0.08), this.darkWoodMat);
        plank.position.set(0, 0.45 + i * 0.42, 0.25 - (i % 2) * 0.12);
        plank.rotation.z = (i % 2 === 0 ? 1 : -1) * (0.14 + i * 0.05);
        plank.castShadow = true;
        plank.userData = { interactableType: 'barricaded_stairs' };
        barricadeGroup.add(plank);
      }

      const barbedWireMat = new THREE.MeshStandardMaterial({
        color: 0x4a201a,
        roughness: 0.42,
        metalness: 0.82
      });
      for (let w = -0.75; w <= 0.75; w += 0.5) {
        const wireCoil = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.28, 0.018, 48, 8, 2, 3),
          barbedWireMat
        );
        wireCoil.position.set(w, 0.75, 0.32);
        wireCoil.userData = { interactableType: 'barricaded_stairs' };
        barricadeGroup.add(wireCoil);
      }

      const stairHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 2.4, 1.25),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      stairHitbox.position.set(0, 1.2, 0.25);
      stairHitbox.userData = { interactableType: 'barricaded_stairs' };
      barricadeGroup.add(stairHitbox);

      this.scene.add(barricadeGroup);
      this.interactables.push(tornMattress, bloodPatch, tiltedWardrobe, stairHitbox);
    }

    _buildConsoleTableAndFallingVase() {
      const THREE = window.THREE;

      const consoleTable = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.76, 0.38), this.darkWoodMat);
      consoleTable.position.set(17.6, 0.38, -12.46);
      consoleTable.castShadow = true;
      consoleTable.receiveShadow = true;
      this.scene.add(consoleTable);

      const ceramicMat = new THREE.MeshStandardMaterial({
        color: 0x9aa4ad,
        roughness: 0.32,
        metalness: 0.18
      });
      this.vaseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.095, 0.28, 14), ceramicMat);
      this.vaseMesh.position.set(17.6, 0.90, -12.52);
      this.vaseMesh.castShadow = true;
      this.scene.add(this.vaseMesh);

      this.vaseShardsGroup = new THREE.Group();
      this.vaseShardsGroup.position.set(17.6, 0.02, -12.92);
      for (let i = 0; i < 9; i++) {
        const shard = new THREE.Mesh(
          new THREE.ConeGeometry(0.045 + Math.random() * 0.03, 0.03, 4),
          ceramicMat
        );
        const angle = (i / 9) * Math.PI * 2;
        const dist = 0.06 + Math.random() * 0.22;
        shard.position.set(Math.cos(angle) * dist, 0.01, Math.sin(angle) * dist);
        shard.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
        this.vaseShardsGroup.add(shard);
      }
      this.vaseShardsGroup.visible = false;
      this.scene.add(this.vaseShardsGroup);
    }

    _buildCeilingPipesDuctsAndVents() {
      const THREE = window.THREE;

      const westDuct = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, 11.6), this.ductMetalMat);
      westDuct.position.set(-0.75, 2.86, -8.8);
      this.scene.add(westDuct);

      const eastDuct = new THREE.Mesh(new THREE.BoxGeometry(19.5, 0.26, 0.48), this.ductMetalMat);
      eastDuct.position.set(11.2, 2.86, -14.35);
      this.scene.add(eastDuct);

      const pipeGeoWest = new THREE.CylinderGeometry(0.045, 0.045, 11.8, 10);
      const westPipe = new THREE.Mesh(pipeGeoWest, this.ductMetalMat);
      westPipe.rotation.x = Math.PI / 2;
      westPipe.position.set(0.88, 2.88, -8.9);
      this.scene.add(westPipe);

      const ventMat = new THREE.MeshStandardMaterial({
        color: 0x1b1e22,
        roughness: 0.5,
        metalness: 0.75
      });
      [
        [-0.75, 2.73, -6.0],
        [-0.75, 2.73, -11.5],
        [4.2, 2.72, -14.35],
        [8.8, 2.72, -14.35],
        [16.5, 2.72, -14.35]
      ].forEach(([vx, vy, vz]) => {
        const vent = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.03, 0.54), ventMat);
        vent.position.set(vx, vy, vz);
        this.scene.add(vent);
      });

      const cableMat = new THREE.MeshBasicMaterial({ color: 0x0c0e12 });
      const cableAnchors = [
        [new THREE.Vector3(-0.9, 2.95, -5.2), new THREE.Vector3(0.1, 2.48, -6.0), new THREE.Vector3(0.9, 2.95, -6.8)],
        [new THREE.Vector3(-0.9, 2.95, -10.2), new THREE.Vector3(-0.1, 2.42, -11.0), new THREE.Vector3(0.9, 2.95, -11.6)],
        [new THREE.Vector3(3.2, 3.15, -11.8), new THREE.Vector3(4.8, 2.58, -12.6), new THREE.Vector3(6.4, 3.15, -13.2)],
        [new THREE.Vector3(13.5, 2.95, -12.5), new THREE.Vector3(15.0, 2.46, -13.5), new THREE.Vector3(16.6, 2.95, -14.5)]
      ];

      cableAnchors.forEach((pts) => {
        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeo = new THREE.TubeGeometry(curve, 14, 0.014, 6, false);
        const cableMesh = new THREE.Mesh(tubeGeo, cableMat);
        this.scene.add(cableMesh);
      });
    }

    /**
     * 3 & 4. Membangun Pintu Besi "BASEMENT ACCESS - GENERATOR", Tangga Menurun Bawah Tanah,
     *        dan Ruang Generator Basement (12m x 10m di y = -4.4m) + Tuas Manual & Entitas Dash
     */
    _buildBasementStairwellAndMachineRoom() {
      const THREE = window.THREE;

      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x282d33,
        roughness: 0.48,
        metalness: 0.78
      });

      const oilyFloorMat = new THREE.MeshStandardMaterial({
        map: this.corridorFloorMat.map,
        color: 0x202328,
        roughness: 0.45,
        metalness: 0.22,
        side: THREE.DoubleSide
      });

      // ====================================================================
      // A. PINTU BESI TEBAL "BASEMENT ACCESS - GENERATOR" (x = 3.9, z = -22.6)
      //    Daun pintu diayunkan penuh ke samping kanan dalam Ruang Panel 3B
      //    sehingga mulut lubang tangga (x = 3.0 s/d 4.8) terbuka 100% bebas hambatan!
      // ====================================================================
      this.basementDoorPivot = new THREE.Group();
      this.basementDoorPivot.position.set(4.78, 0, -22.52);
      this.basementDoorPivot.rotation.y = Math.PI * 0.48;
      this.scene.add(this.basementDoorPivot);

      const bDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.98, 2.22, 0.07), steelMat);
      bDoorMesh.position.set(0.49, 1.11, 0);
      bDoorMesh.castShadow = true;
      bDoorMesh.userData = { interactableType: 'basement_access_door' };
      this.basementDoorPivot.add(bDoorMesh);

      // Pelat Tulisan "BASEMENT ACCESS - GENERATOR"
      const bSignCanvas = document.createElement('canvas');
      bSignCanvas.width = 512;
      bSignCanvas.height = 160;
      const bctx = bSignCanvas.getContext('2d');
      bctx.fillStyle = '#1b1917';
      bctx.fillRect(0, 0, 512, 160);
      bctx.strokeStyle = '#d97706';
      bctx.lineWidth = 8;
      bctx.strokeRect(8, 8, 496, 144);
      bctx.fillStyle = '#fef3c7';
      bctx.font = 'bold 30px "Share Tech Mono", monospace';
      bctx.textAlign = 'center';
      bctx.fillText('BASEMENT ACCESS', 256, 66);
      bctx.fillStyle = '#f59e0b';
      bctx.font = 'bold 26px "Share Tech Mono", monospace';
      bctx.fillText('EMERGENCY GENERATOR', 256, 114);

      const bSignTex = new THREE.CanvasTexture(bSignCanvas);
      const bSignMat = new THREE.MeshStandardMaterial({
        map: bSignTex,
        emissive: 0x332006,
        emissiveMap: bSignTex,
        emissiveIntensity: 0.65,
        roughness: 0.4
      });
      const bSignMesh = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.24, 0.02), bSignMat);
      bSignMesh.position.set(0.49, 1.48, 0.045);
      bSignMesh.userData = { interactableType: 'basement_access_door' };
      this.basementDoorPivot.add(bSignMesh);
      this.interactables.push(bDoorMesh, bSignMesh);

      // Pelat di atas kusen pintu Basement Access
      const headerSign = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.28, 0.03), bSignMat);
      headerSign.position.set(3.9, 2.48, -22.49);
      this.scene.add(headerSign);

      // ====================================================================
      // B. TANGGA BETON/BESI TERBUKA DENGAN PIJAKAN JELAS (TREADS & RISERS)
      // Flight 1: z = -22.6 s/d -28.6 (turun dari y = 0.0 ke y = -2.2m)
      // Bordes Tengah: z = -28.6 s/d -30.4 (datar bebas hambatan di y = -2.2m)
      // Flight 2: z = -30.4 s/d -36.4 (turun dari y = -2.2m ke y = -4.4m)
      // ====================================================================
      const stairWidth = 1.76;
      const treadMat = new THREE.MeshStandardMaterial({
        color: 0x2b3036,
        roughness: 0.68,
        metalness: 0.28
      });
      const riserMat = new THREE.MeshStandardMaterial({
        color: 0x1b1e23,
        roughness: 0.82,
        metalness: 0.18
      });
      const nosingMat = new THREE.MeshStandardMaterial({
        color: 0x85682a,
        emissive: 0x261c08,
        emissiveIntensity: 0.35,
        roughness: 0.45,
        metalness: 0.65
      });

      // 12 anak tangga pada Flight 1 (treads + risers + nosing strip jelas)
      for (let i = 0; i < 12; i++) {
        const sz = -22.6 - (i + 0.5) * 0.5;
        const sy = -((i + 1) / 12) * 2.2;
        const tread = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.05, 0.48), treadMat);
        tread.position.set(3.9, sy - 0.025, sz);
        tread.receiveShadow = true;
        this.scene.add(tread);

        const nosing = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.028, 0.045), nosingMat);
        nosing.position.set(3.9, sy - 0.012, sz - 0.22);
        this.scene.add(nosing);

        const riser = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.185, 0.04), riserMat);
        riser.position.set(3.9, sy + 0.09, sz + 0.22);
        this.scene.add(riser);
      }

      // Bordes Tengah Bebas Hambatan (z = -28.6 s/d -30.4, y = -2.2m)
      const midLanding = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.16, 1.88), treadMat);
      midLanding.position.set(3.9, -2.28, -29.5);
      midLanding.receiveShadow = true;
      this.scene.add(midLanding);

      // 12 anak tangga pada Flight 2 (treads + risers + nosing strip jelas)
      for (let i = 0; i < 12; i++) {
        const sz = -30.4 - (i + 0.5) * 0.5;
        const sy = -2.2 - ((i + 1) / 12) * 2.2;
        const tread = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.05, 0.48), treadMat);
        tread.position.set(3.9, sy - 0.025, sz);
        tread.receiveShadow = true;
        this.scene.add(tread);

        const nosing = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.028, 0.045), nosingMat);
        nosing.position.set(3.9, sy - 0.012, sz - 0.22);
        this.scene.add(nosing);

        const riser = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.185, 0.04), riserMat);
        riser.position.set(3.9, sy + 0.09, sz + 0.22);
        this.scene.add(riser);
      }

      // Pegangan Besi (Handrail) di Dinding Kiri & Kanan Tangga
      [-0.82, 0.82].forEach((offsetX) => {
        const rail1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 6.4, 8), steelMat);
        rail1.rotation.x = Math.PI / 2 - 0.35;
        rail1.position.set(3.9 + offsetX, -0.2, -25.6);
        this.scene.add(rail1);

        const rail2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 6.4, 8), steelMat);
        rail2.rotation.x = Math.PI / 2 - 0.35;
        rail2.position.set(3.9 + offsetX, -2.4, -33.4);
        this.scene.add(rail2);
      });

      // Dinding Kiri & Kanan Terowongan Tangga (x = 2.95 dan x = 4.85, z = -22.6 s/d -36.4)
      const stairWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 8.2, 14.0), this.corridorWallMat);
      stairWallLeft.position.set(2.95, -1.0, -29.5);
      this.scene.add(stairWallLeft);

      const stairWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 8.2, 14.0), this.corridorWallMat);
      stairWallRight.position.set(4.85, -1.0, -29.5);
      this.scene.add(stairWallRight);

      const stairCeiling = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 14.2), this.corridorCeilingMat);
      stairCeiling.position.set(3.9, 3.0, -29.5);
      this.scene.add(stairCeiling);

      // ====================================================================
      // C. RUANG GENERATOR BASEMENT (THE MACHINE ROOM — 12m x 10m di y = -4.4m)
      // Koordinat: x dari -2.1 s/d +9.9 (12.0m), z dari -36.4 s/d -46.4 (10.0m),
      // Lantai di y = -4.4m, Plafon di y = -0.6m (Tinggi 3.8m)
      // ====================================================================
      const bFloor = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.15, 10.2), oilyFloorMat);
      bFloor.position.set(3.9, -4.475, -41.4);
      bFloor.receiveShadow = true;
      this.scene.add(bFloor);

      const bCeiling = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.15, 10.2), this.corridorCeilingMat);
      bCeiling.position.set(3.9, -0.525, -41.4);
      this.scene.add(bCeiling);

      // Dinding Basement (Utara z = -46.4, Barat x = -2.1, Timur x = +9.9, & Selatan z = -36.4 di kiri-kanan tangga)
      const bNorthWall = new THREE.Mesh(new THREE.BoxGeometry(12.2, 4.0, 0.22), this.corridorWallMat);
      bNorthWall.position.set(3.9, -2.5, -46.4);
      bNorthWall.receiveShadow = true;
      this.scene.add(bNorthWall);

      const bWestWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.0, 10.2), this.corridorWallMat);
      bWestWall.position.set(-2.1, -2.5, -41.4);
      bWestWall.receiveShadow = true;
      this.scene.add(bWestWall);

      const bEastWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.0, 10.2), this.corridorWallMat);
      bEastWall.position.set(9.9, -2.5, -41.4);
      bEastWall.receiveShadow = true;
      this.scene.add(bEastWall);

      const bSouthWallLeft = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.0, 0.22), this.corridorWallMat);
      bSouthWallLeft.position.set(0.4, -2.5, -36.4);
      this.scene.add(bSouthWallLeft);

      const bSouthWallRight = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.0, 0.22), this.corridorWallMat);
      bSouthWallRight.position.set(7.4, -2.5, -36.4);
      this.scene.add(bSouthWallRight);

      // 4 Pilar Beton Tebal di Ruang Generator Basement
      const bPillarGeo = new THREE.BoxGeometry(0.68, 3.9, 0.68);
      [
        [1.1, -2.45, -39.5],
        [6.7, -2.45, -39.5],
        [1.1, -2.45, -43.0],
        [6.7, -2.45, -43.0]
      ].forEach(([px, py, pz]) => {
        const p = new THREE.Mesh(bPillarGeo, this.corridorWallMat);
        p.position.set(px, py, pz);
        p.castShadow = true;
        p.receiveShadow = true;
        this.scene.add(p);
      });

      // Deretan Pipa Uap Besi di Plafon Basement
      for (let pz = -38.0; pz >= -45.0; pz -= 2.3) {
        const steamPipe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 11.8, 12),
          this.ductMetalMat
        );
        steamPipe.rotation.z = Math.PI / 2;
        steamPipe.position.set(3.9, -0.85, pz);
        this.scene.add(steamPipe);
      }

      // ====================================================================
      // D. UNIT GENERATOR DIESEL DARURAT BESAR & TUAS MANUAL (x = 3.9, y = -4.4, z = -44.2)
      // ====================================================================
      this.generatorGroup = new THREE.Group();
      this.generatorGroup.position.set(3.9, -4.4, -44.2);

      const genBodyMat = new THREE.MeshStandardMaterial({
        color: 0x3b2c20,
        roughness: 0.62,
        metalness: 0.72
      });

      // Blok Mesin Utama Generator Diesel
      const genMainBlock = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.55, 1.45), genBodyMat);
      genMainBlock.position.set(0, 0.775, 0);
      genMainBlock.castShadow = true;
      genMainBlock.receiveShadow = true;
      this.generatorGroup.add(genMainBlock);

      // Turbin Silinder Dinamo
      const genTurbine = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 2.1, 16), steelMat);
      genTurbine.rotation.z = Math.PI / 2;
      genTurbine.position.set(0, 1.15, 0.15);
      this.generatorGroup.add(genTurbine);

      // Panel Sakelar Samping Generator tempat Tuas Manual dipasang
      const switchBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.68, 0.35), steelMat);
      switchBox.position.set(-1.15, 1.25, 0.65);
      switchBox.userData = { interactableType: 'generator_lever' };
      this.generatorGroup.add(switchBox);

      // Tuas Manual Besar (generatorLeverPivot & generatorLeverMesh) Berbahan Logam Berkarat
      const rustyLeverMat = new THREE.MeshStandardMaterial({
        color: 0x7c2d12,
        emissive: 0x2a0e05,
        emissiveIntensity: 0.4,
        roughness: 0.55,
        metalness: 0.78
      });

      this.generatorLeverPivot = new THREE.Group();
      this.generatorLeverPivot.position.set(-1.15, 1.28, 0.84);
      // Posisi awal tuas mengarah ke atas (-0.35 rad)
      this.generatorLeverPivot.rotation.x = -0.35;
      this.generatorGroup.add(this.generatorLeverPivot);

      const leverArm = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.42, 10), rustyLeverMat);
      leverArm.position.set(0, 0.18, 0.08);
      leverArm.rotation.x = 0.4;
      leverArm.userData = { interactableType: 'generator_lever' };
      this.generatorLeverPivot.add(leverArm);

      const leverGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.18, 12), rustyLeverMat);
      leverGrip.rotation.z = Math.PI / 2;
      leverGrip.position.set(0, 0.34, 0.16);
      leverGrip.userData = { interactableType: 'generator_lever' };
      this.generatorLeverPivot.add(leverGrip);

      // Hitbox Tuas Generator agar mudah dijangkau Raycaster
      const leverHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.95, 0.85),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      leverHitbox.position.set(-1.15, 1.28, 0.75);
      leverHitbox.userData = { interactableType: 'generator_lever' };
      this.generatorGroup.add(leverHitbox);

      this.scene.add(this.generatorGroup);
      this.interactables.push(switchBox, leverArm, leverGrip, leverHitbox);

      // Lampu indikator kecil di atas tuas generator (merah saat mati, kuning/hijau saat menyala)
      this.genStatusLight = new THREE.PointLight(0xaa1111, 0.85, 5.5, 2);
      this.genStatusLight.position.set(2.75, -2.8, -43.1);
      this.scene.add(this.genStatusLight);

      // Lampu-lampu Kuning Industri Basement (awalnya sangat redup 0.12, menyala ke 1.5 saat generator aktif!)
      [
        [3.9, -0.95, -38.5],
        [3.9, -0.95, -42.5]
      ].forEach(([lx, ly, lz]) => {
        const bIndLight = new THREE.PointLight(0xffcc77, 0.15, 14.0, 2);
        bIndLight.position.set(lx, ly, lz);
        this.scene.add(bIndLight);
        this.industrialRecoveryLights.push({ light: bIndLight, targetIntensity: 1.5 });
      });

      // Entitas Bayangan Bermata Merah untuk Jumpscare Lari Cepat (Dash / Flicker Encounter) di Basement
      this.basementDashEntity = createShadowRedEyesEntity(THREE);
      this.basementDashEntity.position.set(-0.8, -4.4, -41.3);
      this.basementDashEntity.visible = false;
      this.scene.add(this.basementDashEntity);
    }

    /**
     * Menghitung elevasi ketinggian lantai (floorY) berdasarkan koordinat (x, z)
     * agar pemain dapat menuruni dan menaiki tangga Basement secara mulus!
     */
    getFloorElevationAt(x, z) {
      if (this.isOnFloorTwo) {
        // Bordes Tangga Darurat Lantai 2 & Koridor Lantai 2 (z <= -9.7) -> y = 0.0m
        if (z <= -9.7) {
          return 0.0;
        }
        // Tangga Darurat Menurun Lantai 2 -> Lantai 1 (z dari -9.7 s/d -1.3) -> turun linear dari 0.0m ke -4.2m
        if (z > -9.7 && z < -1.3) {
          const t = (z - (-9.7)) / 8.4;
          return -t * 4.2;
        }
        // Bordes Bawah Tangga & Koridor Staf Lantai 1 (z >= -1.3) -> datar di y = -4.2m
        return -4.2;
      }
      if (z >= -22.6) {
        return 0.0;
      }
      // Flight 1: z dari -22.6 s/d -28.6 -> turun linear dari 0.0m ke -2.2m
      if (z < -22.6 && z >= -28.6) {
        const t = (-22.6 - z) / 6.0;
        return -t * 2.2;
      }
      // Bordes Sempit Tengah: z dari -28.6 s/d -30.4 -> datar di -2.2m
      if (z < -28.6 && z >= -30.4) {
        return -2.2;
      }
      // Flight 2: z dari -30.4 s/d -36.4 -> turun linear dari -2.2m ke -4.4m
      if (z < -30.4 && z >= -36.4) {
        const t = (-30.4 - z) / 6.0;
        return -2.2 - t * 2.2;
      }
      // Lantai Ruang Generator Basement (z < -36.4) -> datar di -4.4m
      return -4.4;
    }

    /**
     * Merender tampilan layar hijau fosfor CRT CCTV (Scanline/Noise + Penampakan Mata Merah di detik 1.5)
     */
    _updateCctvMonitorCanvas(elapsed) {
      if (!this.cctvCtx || !this.cctvTex) return;
      const ctx = this.cctvCtx;
      const w = 256;
      const h = 192;

      // Latar hijau fosfor gelap ruang generator basement
      ctx.fillStyle = '#041408';
      ctx.fillRect(0, 0, w, h);

      // Gambar siluet pilar & generator basement pada kamera CCTV
      ctx.fillStyle = '#0a2912';
      ctx.fillRect(28, 20, 26, 150);
      ctx.fillRect(198, 20, 26, 150);
      ctx.fillStyle = '#0e3618';
      ctx.fillRect(88, 78, 80, 68);

      // Jika sedang dalam sekuens inspeksi CCTV pada detik ke-1.5 s/d 1.9 (durasi 0.4 detik):
      // Sepasang mata merah menyala melesat kencang dari kanan ke kiri dengan glitch!
      if (this.isCctvInspecting && this.cctvInspectTimer >= 1.5 && this.cctvInspectTimer <= 1.92) {
        const dashProg = (this.cctvInspectTimer - 1.5) / 0.4;
        const ex = 220 - dashProg * 195;
        const ey = 96 + Math.sin(dashProg * 25) * 6;

        // Glitch horizontal bars
        ctx.fillStyle = 'rgba(180, 255, 200, 0.35)';
        ctx.fillRect(0, (Math.random() * h) | 0, w, 14);

        // Siluet hitam pekat berlari
        ctx.fillStyle = '#010302';
        ctx.beginPath();
        ctx.ellipse(ex, ey + 25, 22, 48, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Sepasang mata merah menyala tajam
        ctx.fillStyle = '#ff1111';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(ex - 7, ey - 8, 4.5, 0, Math.PI * 2);
        ctx.arc(ex + 7, ey - 8, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Garis-garis Scanline CRT & bintik noise fosfor
      ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 2);
      }
      for (let i = 0; i < 45; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(90, 255, 130, 0.18)' : 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 12 + Math.random() * 25, 2);
      }

      // Label OSD Kamera CCTV
      ctx.fillStyle = '#55ff88';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('CAM_04 // BASEMENT GEN', 14, 24);
      ctx.fillText(this.isGeneratorRunning ? 'PWR: ONLINE' : 'PWR: MANUAL_OFF', 14, 178);

      this.cctvTex.needsUpdate = true;
    }

    /**
     * 1. Sekuens Masuk Ruang Panel 3B (maya_enter_maintenance.mp3 — 8000ms)
     */
    _triggerEnterMaintenance3B() {
      if (this.hasEnteredMaintenance3B) return;
      this.hasEnteredMaintenance3B = true;
      this.isActionBusy = true;

      this.game.setObjective('Periksa monitor CCTV dan cari jalan menuju generator darurat.');
      this._playExactTimedMonologue(
        'assets/audio/maya_enter_maintenance.mp3',
        8000,
        'MAYA',
        'Monitor keamanan... tunggu, daya ke lantai bawah ada di mode manual. Generator cadangannya ada di bawah sana.'
      );
    }

    /**
     * 2. Sistem Interaksi Monitor CCTV (Foreshadowing Scare)
     */
    _inspectCctvMonitor() {
      if (this.isCctvInspecting || this.game.isMayaSpeaking) return;
      this.isCctvInspecting = true;
      this.hasInspectedCctv = true;
      this.cctvInspectTimer = 0;
      this.isActionBusy = true;
      this.game.setMayaSpeaking(true);
      this.game._setInteractionPrompt('');

      // Simpan posisi kamera sebelum fokus ke layar monitor CCTV
      if (this.game.camera) {
        this.savedCamBeforeCctv = {
          x: this.game.camera.position.x,
          y: this.game.camera.position.y,
          z: this.game.camera.position.z,
          yaw: this.game.yaw,
          pitch: this.game.pitch
        };
      }

      // Putar audio statis CCTV: assets/audio/sfx_cctv_static.mp3
      this.game.playOneShotSfx('assets/audio/sfx_cctv_static.mp3');

      // Setelah 2.2 detik (setelah mata merah melesat di detik 1.5 - 1.9), kembalikan kamera & putar reaksi Maya
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.isCctvInspecting = false;
        if (this.savedCamBeforeCctv && this.game.camera) {
          this.game.camera.position.x = this.savedCamBeforeCctv.x;
          this.game.camera.position.z = this.savedCamBeforeCctv.z;
        }

        // Putar monolog reaksi Maya: maya_cctv_reaction.mp3 (Durasi presisi: 6000ms)
        this.game.setObjective('Turun ke basement dan nyalakan generator darurat.');
        this._playExactTimedMonologue(
          'assets/audio/maya_cctv_reaction.mp3',
          6000,
          'MAYA',
          '[terkesiap] Kamu lihat itu barusan?! Ada sesuatu yang baru saja lari melintasi kamera empat... dia ada di bawah sana.'
        );
      }, 2200);
    }

    /**
     * 5. Menyalakan Generator Darurat (Tuas berotasi 45 derajat + Pemulihan Daya Listrik Gedung)
     */
    _pullGeneratorLever() {
      if (this.isGeneratorRunning || this.isLeverAnimating || this.game.isMayaSpeaking) return;
      this.isLeverAnimating = true;
      this.leverAnimStart = performance.now();
      this.isActionBusy = true;
      this.game._setInteractionPrompt('');

      // 1. Putar audio tarikan tuas logam berat: assets/audio/sfx_lever_pull.mp3
      this.game.playOneShotSfx('assets/audio/sfx_lever_pull.mp3');

      // 2. Setelah tuas ditarik turun (~500ms), putar mesin mulai meraung: sfx_generator_start.mp3
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.isGeneratorRunning = true;
        this.isElevatorPowered = true;
        this.game.isElevatorPowered = true;

        this.game.playOneShotSfx('assets/audio/sfx_generator_start.mp3');

        if (this.genStatusLight) {
          this.genStatusLight.color.setHex(0x44ff66);
          this.genStatusLight.intensity = 1.6;
        }

        // Lampu-lampu neon di basement dan lantai 3 berkedip hidup satu per satu (kuning industri redup intensitas 1.5)
        this.industrialRecoveryLights.forEach((item, idx) => {
          this.game.setPauseAwareTimeout(() => {
            if (item.light) {
              item.light.color.setHex(0xffcc77);
              item.light.intensity = item.targetIntensity || 1.5;
            }
          }, 450 + idx * 550);
        });

        // Pulihkan lampu neon lobi utama lantai 3 dengan warna kuning industri (intensitas 1.5)
        this.game.setPauseAwareTimeout(() => {
          if (this.lobbyNeonLight) {
            this.lobbyNeonLight.color.setHex(0xffcc77);
            this.lobbyNeonLight.intensity = 1.5;
          }
          if (this.lobbyNeonMat) {
            this.lobbyNeonMat.emissive.setHex(0xffcc77);
            this.lobbyNeonMat.emissiveIntensity = 0.55;
          }
          if (this.elevatorErrorLight) {
            this.elevatorErrorLight.color.setHex(0x33ff77);
            this.elevatorErrorLight.intensity = 1.2;
          }
          if (this.elevatorButtonMat) {
            this.elevatorButtonMat.color.setHex(0x33ff77);
          }
        }, 1200);

        // 3. Jalankan monolog Maya: maya_generator_on.mp3 (Durasi presisi: 8000ms)
        this.game.setObjective('Kembali ke lantai tiga dan masuki lift utama di lobi sebelum terlambat.');
        this._playExactTimedMonologue(
          'assets/audio/maya_generator_on.mp3',
          8000,
          'MAYA',
          'Berhasil! Saklar utamanya mendengung. Lift di lobi pasti sudah nyala sekarang... aku harus segera kembali ke atas!'
        );
      }, 550);
    }

    _buildEmergencyWallLights() {
      const THREE = window.THREE;
      const lampHousingMat = new THREE.MeshStandardMaterial({
        color: 0x221010,
        roughness: 0.5,
        metalness: 0.6
      });

      const emergencySpots = [
        { lx: -1.18, ly: 2.38, lz: -5.8, fx: -1.30, fz: -5.8, isLobby: false },
        { lx: -1.18, ly: 2.38, lz: -13.6, fx: -1.30, fz: -13.6, isLobby: false },
        { lx: 3.35, ly: 2.45, lz: -10.0, fx: 3.35, fz: -9.72, isLobby: true },
        { lx: 9.45, ly: 2.45, lz: -10.0, fx: 9.45, fz: -9.72, isLobby: true },
        { lx: 20.8, ly: 2.42, lz: -10.2, fx: 21.0, fz: -9.8, isLobby: false }
      ];

      emergencySpots.forEach((spot) => {
        const lensMat = new THREE.MeshStandardMaterial({
          color: 0xff2222,
          emissive: 0xaa1111,
          emissiveIntensity: 0.95,
          roughness: 0.2
        });
        const ptLight = new THREE.PointLight(0x881111, 1.05, 11.0, 2);
        ptLight.position.set(spot.lx, spot.ly, spot.lz);
        this.scene.add(ptLight);

        const housing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.22), lampHousingMat);
        housing.position.set(spot.fx, spot.ly, spot.fz);
        this.scene.add(housing);

        const lens = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.18), lensMat);
        lens.position.set(spot.fx, spot.ly - 0.01, spot.fz);
        this.scene.add(lens);

        if (spot.isLobby) {
          this.lobbyEmergencyLights.push({ light: ptLight, lensMat });
        }
      });
    }

    isPositionWalkable(x, z, r) {
      if (!this.game.isDoorOpen) return false;

      if (this.isOnFloorTwo) {
        return this._isFloorTwoPositionWalkable(x, z, r);
      }

      // 1. Hub Utama / Lobby Sentral (10m x 8m)
      const inLobby = (
        x >= 1.4 + r &&
        x <= 11.4 - r &&
        z >= -17.6 + r &&
        z <= -9.6 - r
      );

      // 2. Jalur Sayap Barat -> Lobby -> Sayap Timur
      const inWingConnector = (
        x >= 0.8 &&
        x <= 22.4 - r &&
        z >= -15.0 + r &&
        z <= -12.2 - r
      );

      // 3. Ambang Pintu & Interior Kamar 304 (5m x 4m)
      const inRoom304Doorway = !this.isRoom304TrapLocked && (
        x >= 14.3 + r * 0.5 &&
        x <= 15.3 - r * 0.5 &&
        z >= -15.55 &&
        z <= -14.45
      );

      const inRoom304Interior = (
        x >= 12.3 + r &&
        x <= 17.3 - r &&
        z >= -19.0 + r &&
        z <= -15.0 - r * 0.55
      );

      if (inRoom304Interior) {
        if (x - r < 13.9 && z + r > -18.2 && z - r < -16.0) return false;
        if (x + r > 15.1 && x - r < 16.6 && z - r < -17.85) return false;
        return true;
      }

      // 3B. Interior Kabin Lift Utama (x: 7.05..8.75, z: -10.2..-7.7) saat pintu lift terbuka
      const inElevatorCabin = (this.isElevatorCabinOpen || this.isInsideElevatorCabin) && (
        x >= 7.05 + r * 0.4 &&
        x <= 8.75 - r * 0.4 &&
        z >= (this.isElevatorDescending && !this.isOnFloorTwo ? -9.55 : -10.4) &&
        z <= -7.7 + r * 0.3
      );
      if (inElevatorCabin) return true;

      // 4. Ambang Pintu & Interior Ruang Panel 3B (6m x 5m: x dari -0.1 s/d +5.9, z dari -17.6 s/d -22.6)
      const inMaintenance3BDoorway = this.isMaintenance3BOpen && (
        x >= 2.32 + r * 0.3 &&
        x <= 3.48 - r * 0.3 &&
        z >= -18.3 &&
        z <= -16.9
      );
      const inMaintenance3BInterior = this.isMaintenance3BOpen && (
        x >= -0.1 + r &&
        x <= 5.9 - r &&
        z >= -22.75 &&
        z <= -17.6 - r * 0.25
      );
      // 5. Pintu & Tangga Menuju Basement (x: 3.02..4.78, z: -37.2..-21.8 — menyambung mulus tanpa dinding tak kasat mata!)
      const inBasementStairwell = this.isMaintenance3BOpen && (
        x >= 3.02 + r * 0.35 &&
        x <= 4.78 - r * 0.35 &&
        z >= -37.2 &&
        z <= -21.8
      );
      if (inBasementStairwell) return true;

      if (inMaintenance3BInterior) {
        // Collider meja CCTV (x: 0.15..2.35, z: -21.7..-20.7)
        if (x + r > 0.15 && x - r < 2.35 && z + r > -21.7 && z - r < -20.7) {
          return false;
        }
        return true;
      }

      // 6. Ruang Generator Basement (12m x 10m: x dari -2.1 s/d +9.9, z dari -46.4 s/d -36.0)
      const inBasementMachineRoom = this.isMaintenance3BOpen && (
        x >= -2.1 + r &&
        x <= 9.9 - r &&
        z >= -46.4 + r &&
        z <= -36.0
      );
      if (inBasementMachineRoom) {
        // Collider Unit Generator Diesel (x: 2.3..5.2, z: -45.1..-43.3)
        if (x + r > 2.4 && x - r < 5.2 && z + r > -45.1 && z - r < -43.3) {
          return false;
        }
        // Collider 4 Pilar Beton Basement
        const pillars = [
          [1.1, -39.5],
          [6.7, -39.5],
          [1.1, -43.0],
          [6.7, -43.0]
        ];
        for (let i = 0; i < pillars.length; i++) {
          const [px, pz] = pillars[i];
          if (Math.abs(x - px) < 0.34 + r && Math.abs(z - pz) < 0.34 + r) {
            return false;
          }
        }
        return true;
      }

      // 5. Bordes Tangga Darurat
      const inStairwellApproach = (
        x >= 19.6 + r &&
        x <= 22.4 - r &&
        z >= -13.0 &&
        z <= -9.55
      );

      return (
        inLobby ||
        inWingConnector ||
        inRoom304Doorway ||
        inMaintenance3BDoorway ||
        inMaintenance3BInterior ||
        inStairwellApproach
      );
    }

    /**
     * Evaluasi Collider Lantai 2 (The Flooded Ward):
     * - Kabin Lift (x: 7.05..8.75, z: -9.6..-7.7)
     * - Celah Merayap Pintu Lift (x: 7.25..8.55, z: -10.1..-9.4) -> WAJIB JONGKOK (isCrouching === true)!
     * - Koridor Selatan (x: 4.0..20.0, z: -12.5..-9.7)
     * - Bordes Tangga Darurat Lantai 2 (x: 0.8..4.1, z: -12.5..-9.7) -> hanya jika isFloor2StairDoorOpen === true
     * - Koridor Barat (x: 4.0..6.8, z: -24.5..-12.5)
     * - Kamar 201 (x: 0.0..4.15, z: -18.4..-14.0) via pintu terbuka separuh di z: -16.75..-15.65
     * - Lubang Tembok Jebol 201 -> 203 (x: 1.25..2.75, z: -18.8..-18.0)
     * - Kamar 203 (x: 0.0..4.0, z: -22.8..-18.4)
     * - Koridor Timur (x: 17.2..20.0, z: -24.5..-12.5)
     * - Koridor Utara (x: 4.0..20.0, z: -24.5..-21.7)
     * - Kamar 205 Gudang Servis (x: 16.4..21.2, z: -28.6..-24.3) via pintu x: 18.0..19.2
     */
    _isFloorTwoPositionWalkable(x, z, r) {
      // 1. Interior Kabin Lift
      const inCabin = (
        x >= 7.05 + r * 0.35 &&
        x <= 8.75 - r * 0.35 &&
        z >= -9.55 &&
        z <= -7.7 + r * 0.3
      );
      if (inCabin) return true;

      // 2. Celah Bawah Pintu Lift (50 cm) -> Pemain wajib menekan tombol jongkok ([Shift] / [C]) untuk merayap keluar!
      const inElevatorCrawlGap = (
        x >= 7.22 + r * 0.3 &&
        x <= 8.58 - r * 0.3 &&
        z >= -10.05 &&
        z <= -9.45
      );
      if (inElevatorCrawlGap) {
        if (!this.game.isCrouching && !this.hasCrawledOutOfElevator) {
          this.game._setInteractionPrompt('Celah pintu lift hanya 50 cm! Tekan [SHIFT] atau [C] untuk merayap keluar.');
          return false;
        }
        return true;
      }

      // 3. Bordes Tangga Darurat Lantai 2, Tangga Turun ke Lantai 1, & Koridor Staf Lantai 1
      // Pastikan bounding box tangga hanya menopang pijakan dan tidak menutup jalan keluar menuju pintu darurat Lantai 1!
      const inStairwellToFloor1 = (this.isFloor2StairDoorOpen || this.isFloor2StairDoorSlammedSafe) && (
        x >= 0.85 + r * 0.25 &&
        x <= 2.95 - r * 0.25 &&
        z >= -12.4 &&
        z <= (this.isFloor1EntryDoorOpen ? 2.2 : 1.42)
      );
      if (inStairwellToFloor1) return true;

      const inFloor1EntryDoorway = this.isFloor1EntryDoorOpen && (
        x >= 1.05 &&
        x <= 2.75 &&
        z >= 0.8 &&
        z <= 2.4
      );
      if (inFloor1EntryDoorway) return true;

      const inFloor1StaffCorridor = this.isFloor1EntryDoorOpen && (
        x >= 0.48 + r * 0.5 &&
        x <= 3.32 - r * 0.5 &&
        z >= 1.2 &&
        z <= (this.isFloor1DoubleDoorUnlocked && !this.isPlayerTrappedInArchive ? 18.2 : 17.38)
      );
      if (inFloor1StaffCorridor) {
        // Collider Loker Inventaris & Meja Pos Keamanan di sisi barat koridor (x < 1.32, z: 5.0..8.65)
        if (x - r < 1.32 && z + r > 5.0 && z - r < 8.65) {
          return false;
        }
        return true;
      }

      // Ambang Pintu Masuk Ruang Arsip (z = 17.0..18.0): Terkunci rapat kembali begitu jebakan Panic Archive aktif!
      const inFloor1DoubleDoorway = (
        this.isFloor1DoubleDoorUnlocked &&
        (!this.isPlayerTrappedInArchive || this.isArchiveExitBreached) &&
        x >= 1.05 + r * 0.3 &&
        x <= 2.75 - r * 0.3 &&
        z >= 17.0 &&
        z <= 18.1
      );
      if (inFloor1DoubleDoorway) return true;

      // Interior Ruang Arsip Darurat (Panic Archive Room: x = -1.0..+4.8, z = 17.75..24.25)
      // Pemain tetap bebas bergerak terbatas di dalam Ruang Arsip selama dialog berlangsung!
      const inPanicArchiveRoom = this.isFloor1DoubleDoorUnlocked && (
        x >= -0.95 + r * 0.5 &&
        x <= 4.75 - r * 0.5 &&
        z >= (this.isPlayerTrappedInArchive && !this.isArchiveExitBreached ? 17.82 : 17.5) &&
        z <= (this.isArchiveExitBreached ? 24.8 : 24.22)
      );
      if (inPanicArchiveRoom) {
        // Collider Meja Kerja di Ruang Arsip (x: 2.55..4.15, z: 21.85..22.95)
        if (x + r > 2.55 && x - r < 4.15 && z + r > 21.85 && z - r < 22.95) {
          return false;
        }
        return true;
      }

      // Ambang Pintu Keluar Ruang Arsip & Atrium Lobi Utama (z = 24.2 s/d 36.0) setelah Dhafir menembak engsel pintu!
      const inMainLobbyAtrium = this.isArchiveExitBreached && (
        x >= -2.0 + r &&
        x <= 5.8 - r &&
        z >= 24.0 &&
        z <= 35.9
      );
      if (inMainLobbyAtrium) return true;

      if (this.isFloor2StairDoorSlammedSafe) {
        return (
          x >= 0.8 + r &&
          x <= 3.9 - r * 0.5 &&
          z >= -12.5 + r &&
          z <= -9.6
        );
      }
      const inFloor2StairLanding = this.isFloor2StairDoorOpen && (
        x >= 0.8 + r &&
        x <= 4.2 &&
        z >= -12.4 + r * 0.5 &&
        z <= -9.8 - r * 0.5
      );
      if (inFloor2StairLanding) return true;

      // 4. Koridor Persegi Melingkar Lantai 2 (South, West, East, North)
      const inSouthCorridor = (
        x >= 4.0 + r * 0.6 &&
        x <= 20.0 - r * 0.6 &&
        z >= -12.5 + r * 0.5 &&
        z <= -9.7 - r * 0.5
      );
      const inWestCorridor = (
        x >= 4.0 + r * 0.5 &&
        x <= 6.8 - r * 0.5 &&
        z >= -24.5 + r * 0.5 &&
        z <= -12.2
      );
      const inEastCorridor = (
        x >= 17.2 + r * 0.5 &&
        x <= 20.0 - r * 0.5 &&
        z >= -24.5 + r * 0.5 &&
        z <= -12.2
      );
      const inNorthCorridor = (
        x >= 4.0 + r * 0.5 &&
        x <= 20.0 - r * 0.5 &&
        z >= -24.5 + r * 0.5 &&
        z <= -21.7 - r * 0.5
      );

      // 5. Ambang Pintu & Interior Kamar 201 (x: 0.0..4.0, z: -18.4..-14.0)
      const inRoom201Doorway = (
        x >= 3.6 &&
        x <= 4.35 &&
        z >= -16.75 &&
        z <= -15.65
      );
      const inRoom201 = (
        x >= 0.0 + r &&
        x <= 4.0 - r * 0.4 &&
        z >= -18.4 + r * 0.4 &&
        z <= -14.0 - r
      );

      // 6. Lubang Tembok Jebol antara Kamar 201 dan Kamar 203 (x: 1.25..2.75, z: -18.85..-17.95)
      const inBreachedWallHole = (
        x >= 1.28 + r * 0.3 &&
        x <= 2.72 - r * 0.3 &&
        z >= -18.85 &&
        z <= -17.95
      );

      // 7. Interior Kamar 203 (x: 0.0..4.0, z: -22.8..-18.4)
      const inRoom203 = (
        x >= 0.0 + r &&
        x <= 4.0 - r * 0.5 &&
        z >= -22.8 + r &&
        z <= -18.4 - r * 0.4
      );

      // 8. Kamar 205 — Gudang Servis (x: 16.4..21.2, z: -28.6..-24.5, pintu di x: 17.9..19.3)
      const inRoom205Doorway = (
        x >= 17.95 &&
        x <= 19.25 &&
        z >= -24.85 &&
        z <= -24.15
      );
      const inRoom205 = (
        x >= 16.4 + r &&
        x <= 21.2 - r &&
        z >= -28.6 + r &&
        z <= -24.5 - r * 0.4
      );

      return (
        inSouthCorridor ||
        inWestCorridor ||
        inEastCorridor ||
        inNorthCorridor ||
        inRoom201Doorway ||
        inRoom201 ||
        inBreachedWallHole ||
        inRoom203 ||
        inRoom205Doorway ||
        inRoom205
      );
    }

    /**
     * Fallback deteksi jarak dekat (proximity) untuk objek penting di Tangga Bawah & Lantai 1
     * agar pemain tetap dapat menekan [E] meskipun kursor tidak tepat di tengah hitbox kecil.
     */
    getProximityInteractable(camPos) {
      if (!camPos || !this.isOnFloorTwo) return null;

      // 1. Pintu Keluar Darurat "Lantai 1 - Area Staf" di ujung bawah tangga darurat (z = +1.5)
      if (
        !this.isFloor1EntryDoorOpen &&
        !this.isFloor1EntryDoorAnimating &&
        camPos.x >= 0.75 &&
        camPos.x <= 3.05 &&
        camPos.z >= -0.8 &&
        camPos.z <= 1.55
      ) {
        return {
          type: 'floor1_stair_exit_door',
          prompt: '[E] Buka Pintu Darurat (Lantai 1 - Area Staf)'
        };
      }

      // 2. Unit Radio HT di atas meja keamanan Lantai 1 (radius <= 2.5 meter dari (1.08, -3.41, 7.8))
      if (this.radioHTMesh && !this.hasPickedUpRadioHT && camPos.y < -2.0) {
        const distToRadio = Math.hypot(camPos.x - 1.08, camPos.z - 7.8);
        if (distToRadio <= 2.5) {
          return {
            type: 'radio_ht',
            prompt: '[E] Ambil Radio HT'
          };
        }
      }

      // 3. Pintu Double-Door di ujung koridor staf Lantai 1 (z = +17.5)
      if (
        this.isFloor1EntryDoorOpen &&
        !this.isFloor1DoubleDoorUnlocked &&
        camPos.x >= 0.6 &&
        camPos.x <= 3.2 &&
        camPos.z >= 15.3 &&
        camPos.z <= 17.55
      ) {
        return {
          type: 'floor1_double_door',
          prompt: '[Terkunci] Pintu Ganda Ruang Kontrol Keamanan (Selesaikan Transmisi Radio)'
        };
      }

      return null;
    }

    getInteractionPrompt(type) {
      switch (type) {
        case 'lobby_window':
          if (this.isCurtainAnimating) return '';
          return this.areCurtainsOpen ? '[E] Lihat ke Luar' : '[E] Buka Gorden';
        case 'elevator':
          if (this.isOnFloorTwo) {
            return '[Lift Rusak] Pintu Terbuka Paksa di Lantai 2';
          }
          if (this.isElevatorCabinOpen) {
            return 'Melangkah Masuk ke Kabin Lift & Tekan Panel [E]';
          }
          return this.isElevatorPowered
            ? '[E] Buka Pintu Lift Utama (Daya Aktif)'
            : '[E] Tekan Tombol Lift';
        case 'elevator_cabin_panel':
          if (this.isOnFloorTwo) {
            return '[Panel Mati] Lift Macet di Lantai 2';
          }
          if (this.isElevatorDescending) return '';
          return this.isElevatorPowered
            ? '[E] Tekan Tombol Panel Lantai Dasar (Lantai 1)'
            : '[Panel Lift Mati]';
        case 'cctv_monitor':
          return '[E] Periksa Monitor CCTV';
        case 'basement_access_door':
          return '[E] Jalan Menuju Tangga Basement';
        case 'generator_lever':
          return this.isGeneratorRunning
            ? '[Generator Aktif] Daya Listrik Gedung Menyala'
            : '[E] Tarik Tuas Generator Darurat';
        case 'barricaded_stairs':
          return '[E] Periksa Barikade Tangga Darurat';
        case 'room_304_door':
          if (this.isRoom304TrapLocked) {
            return '[Terkunci Rapat] Pintu Kamar 304 Macet!';
          }
          if (this.room304TargetAngle < 1.3 && !this.isRoom304Animating) {
            return '[E] Dorong Pintu Kamar 304 Lebih Lebar';
          }
          return '';
        case 'stairwell_key':
          if (!this.hasMaintenanceKey) {
            return '[E] Ambil Kunci Ruang Panel 3B';
          }
          return '';
        case 'maintenance_3b_door':
          if (this.isMaintenance3BOpen || this.isMaintenance3BAnimating) return '';
          return this.hasMaintenanceKey
            ? '[E] Buka Pintu Maintenance 3B (Gunakan Kunci Panel 3B)'
            : '[Terkunci] Maintenance 3B - Authorized Personnel Only';
        case 'room_305_knock':
          return '[E] Ketuk Pintu';
        case 'room_307_knock':
          return '[E] Ketuk Pintu';
        case 'floor2_padlock':
          if (this.isFloor2StairDoorSlammedSafe) {
            return '[Terkunci Rapat] Entitas Terkunci di Luar Tangga Darurat';
          }
          if (this.isPadlockUnlocked) {
            return 'Melangkah Masuk ke Bordes Tangga Darurat!';
          }
          return (this.hasFullPadlockCode || (this.hasDigit7 && this.hasDigits42))
            ? '[E] Buka Gembok Kombinasi (Masukkan Kode: 7 - 4 - 2)'
            : '[E] Periksa Gembok Kombinasi 3 Angka';
        case 'room201_memo':
          return '[E] Baca Memo Penghuni Kamar 201 (Peringatan Pantulan Air)';
        case 'floor2_breaker':
          return this.isFloor2BreakerOn
            ? '[E] Matikan Saklar Sekring Listrik Lantai 2'
            : '[Sekring Mati] Aliran Listrik Genangan Air Telah Diputus';
        case 'wall_digit_7':
          return '[E] Periksa Angka Tercakar di Dinding: "7"';
        case 'room205_memo':
          return '[E] Periksa Papan Memo Inventaris Gudang 205 ("4 - 2")';
        case 'floor1_stair_exit_door':
          if (this.isFloor1EntryDoorOpen || this.isFloor1EntryDoorAnimating) return '';
          return '[E] Buka Pintu Darurat (Lantai 1 - Area Staf)';
        case 'radio_ht':
          if (this.hasPickedUpRadioHT) return '';
          return '[E] Ambil Radio HT';
        case 'floor1_double_door':
          if (this.isPlayerTrappedInArchive && !this.isArchiveExitBreached) {
            return '[Terkunci Mati] Pintu Hidrolik Baja Mengunci Otomatis dari Luar!';
          }
          if (this.isFloor1DoubleDoorUnlocked) return 'Masuk ke Ruang Arsip / Staf Lantai 1';
          return '[Terkunci] Pintu Ganda Ruang Arsip Staf (Selesaikan Transmisi Radio)';
        case 'archive_hydraulic_door':
          if (this.isArchiveExitBreached) return 'Lari Menuju Atrium Lobi Utama!';
          return '[Terkunci Mati] Panel Elektronik Hangus — Engsel Hidrolik Terkunci';
        case 'main_lobby_glass_exit':
          return '[E] Buka Pintu Kaca Lobi Utama (Menuju Posko Evakuasi Dhafir)';
        default:
          return '';
      }
    }

    handleInteraction(type) {
      // Hormati pembatasan kontrol saat Maya sedang berbicara atau Transmisi Radio berlangsung
      if (this.game.isMayaSpeaking || this.isRadioTransmitting || this.game.isRadioTransmitting) return false;

      if (type === 'floor1_stair_exit_door') {
        this._openFloor1StaffEntryDoor();
        return true;
      }

      if (type === 'radio_ht' && !this.hasPickedUpRadioHT) {
        this._pickupRadioHTAndStartDhafirSequence();
        return true;
      }

      if (type === 'floor1_double_door' || type === 'archive_hydraulic_door') {
        if (!this.isFloor1DoubleDoorUnlocked || (this.isPlayerTrappedInArchive && !this.isArchiveExitBreached)) {
          this.game._playProceduralClickSfx(110);
          this.game.showTemporarySubtitle(
            'PINTU HIDROLIK BAJA',
            'Pintunya terkunci rapat secara magnetik. Panel elektroniknya konslet dan mati.',
            3000
          );
        }
        return true;
      }

      if (type === 'main_lobby_glass_exit') {
        this._triggerMainLobbyDawnEscape();
        return true;
      }

      if (type === 'stairwell_key' && !this.hasMaintenanceKey) {
        this._pickupMaintenanceKeyAndTriggerTrap();
        return true;
      }

      if (type === 'maintenance_3b_door') {
        this._interactMaintenance3BDoor();
        return true;
      }

      if (type === 'room_304_door') {
        if (this.isRoom304TrapLocked) {
          this.game._playProceduralClickSfx(95);
          return true;
        }
        this._openRoom304DoorWider();
        return true;
      }

      if (this.isActionBusy) return false;

      if (type === 'lobby_window') {
        if (!this.areCurtainsOpen && !this.isCurtainAnimating) {
          this._openWindowCurtains();
        } else if (this.areCurtainsOpen && !this.isCurtainAnimating) {
          this._inspectLobbyWindow();
        }
        return true;
      }
      if (type === 'cctv_monitor') {
        this._inspectCctvMonitor();
        return true;
      }
      if (type === 'generator_lever') {
        if (!this.isGeneratorRunning) {
          this._pullGeneratorLever();
        }
        return true;
      }
      if (type === 'basement_access_door') {
        this.game._playProceduralClickSfx(180);
        this.game.showTemporarySubtitle(
          'MAYA',
          'Pintu besi menuju tangga basement terbuka. Gelap sekali di bawah sana... gunakan senter [F].',
          3500
        );
        return true;
      }
      if (type === 'elevator') {
        if (this.isElevatorPowered) {
          this._openPoweredLobbyElevator();
        } else {
          this._inspectBrokenElevator();
        }
        return true;
      }
      if (type === 'elevator_cabin_panel') {
        if (this.isElevatorPowered && !this.isElevatorDescending && !this.isOnFloorTwo) {
          this._activateElevatorCabinDescentAndCrash();
        }
        return true;
      }
      if (type === 'barricaded_stairs') {
        this._inspectBarricadedStairs();
        return true;
      }
      if (type === 'room_305_knock') {
        this._knockRoom305Neighbor();
        return true;
      }
      if (type === 'room_307_knock') {
        this._knockRoom307Entity();
        return true;
      }
      if (type === 'floor2_padlock') {
        this._interactFloor2Padlock();
        return true;
      }
      if (type === 'room201_memo') {
        this._inspectRoom201Memo();
        return true;
      }
      if (type === 'floor2_breaker') {
        this._turnOffFloor2Breaker();
        return true;
      }
      if (type === 'wall_digit_7') {
        this._inspectWallDigit7();
        return true;
      }
      if (type === 'room205_memo') {
        this._inspectRoom205Memo();
        return true;
      }

      return false;
    }

    _playExactTimedMonologue(filePath, exactDurationMs, speaker, subtitleText, onDoneCallback) {
      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
        this.activeMonologueTimer = null;
      }

      this.game.setMayaSpeaking(true);
      this.game.showSubtitle(speaker, subtitleText, false);
      this.game._playAudioWithFallback(filePath, exactDurationMs, null);

      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.game.hideSubtitle();
        this.game.setMayaSpeaking(false);
        this.isActionBusy = false;
        this.activeMonologueTimer = null;
        if (typeof onDoneCallback === 'function') {
          onDoneCallback();
        }
      }, exactDurationMs);
    }

    _openWindowCurtains() {
      this.isCurtainAnimating = true;
      this.curtainAnimStart = performance.now();
      this.game.playOneShotSfx('assets/audio/sfx_curtain_open.mp3');
      this.game._setInteractionPrompt('');
    }

    _inspectLobbyWindow() {
      this.isActionBusy = true;
      if (this.skyFlashLight) {
        this.skyFlashLight.intensity = 1.85;
      }
      this._playExactTimedMonologue(
        'assets/audio/maya_inspect_window.mp3',
        10000,
        'MAYA',
        'Ibu benar... nggak ada satu pun lampu menyala di seluruh kota. Nggak ada mobil, nggak ada sirene... cuma kegelapan tanpa ujung.'
      );
    }

    _inspectBrokenElevator() {
      this.isActionBusy = true;

      if (this.elevatorSparkLight) {
        this.elevatorSparkLight.intensity = 4.2;
        this.game.setPauseAwareTimeout(() => {
          if (this.elevatorSparkLight) this.elevatorSparkLight.intensity = 0;
        }, 320);
      }

      this.game.playOneShotSfx('assets/audio/sfx_elevator_spark.mp3');

      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this._playExactTimedMonologue(
          'assets/audio/maya_inspect_elevator.mp3',
          8000,
          'MAYA',
          'Panelnya korsleting... lift ini mati total. Aku nggak mau ambil risiko terjebak di lorong itu.'
        );
      }, 500);
    }

    _inspectBarricadedStairs() {
      this.isActionBusy = true;
      this._playExactTimedMonologue(
        'assets/audio/maya_inspect_stairs.mp3',
        11000,
        'MAYA',
        'Mereka membarikade seluruh tangga ini... furnitur, kawat patah, semuanya. Apa pun yang naik dari lantai bawah... mereka berusaha menahannya.'
      );
    }

    _openRoom304DoorWider() {
      if (this.isRoom304Animating || this.room304TargetAngle >= 1.4) return;
      this.isRoom304Animating = true;
      this.room304AnimStart = performance.now();
      this.game._playProceduralClickSfx(185);
      this.game._setInteractionPrompt('');
    }

    _knockRoom305Neighbor() {
      this.isActionBusy = true;
      this.game.playOneShotSfx('assets/audio/sfx_door_knock.mp3');

      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this._playExactTimedMonologue(
          'assets/audio/sfx_neighbor_fear.mp3',
          8000,
          'TETANGGA KAMAR 305',
          'Pergi! Siapa pun di luar sana, jangan ketuk pintu ini lagi! Makhluk itu mendengar suara kalian!'
        );
      }, 950);
    }

    _knockRoom307Entity() {
      this.isActionBusy = true;
      this.game.playOneShotSfx('assets/audio/sfx_door_knock.mp3');

      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.room307ThudTimer = 1.8;
        this._playExactTimedMonologue(
          'assets/audio/sfx_door_thud.mp3',
          2600,
          'KAMAR 307',
          '[ Suara benturan berat dari balik pintu... tidak ada jawaban ]'
        );
      }, 1000);
    }

    /**
     * Sekuens Masuk Kamar 304 (Proximity Trigger di Ambang Pintu)
     */
    _triggerRoom304EnterSequence() {
      if (this.hasEnteredRoom304) return;
      this.hasEnteredRoom304 = true;
      this.isActionBusy = true;

      this.game.setObjective('Cari kunci tangga darurat di dalam kamar 304.');
      this._playExactTimedMonologue(
        'assets/audio/maya_room304_enter.mp3',
        8000,
        'MAYA',
        'Baunya busuk di sini... kayak air tergenang dan karat. Pasti ada kunci darurat di suatu tempat.'
      );
    }

    /**
     * 4. Revisi Kunci Kamar 304 ("Ruang Panel 3B / Maintenance 3B") & Jebakan Pintu Terbanting
     */
    _pickupMaintenanceKeyAndTriggerTrap() {
      if (this.hasMaintenanceKey) return;
      this.hasMaintenanceKey = true;
      this.hasStairwellKey = true;
      this.game.hasMaintenanceKey = true;
      this.game.hasStairwellKey = true;

      if (this.stairwellKeyMesh) {
        this.stairwellKeyMesh.visible = false;
        this.scene.remove(this.stairwellKeyMesh);
      }
      this.game._setInteractionPrompt('');

      if (this.game.keyHudBadge) {
        this.game.keyHudBadge.textContent = 'KUNCI PANEL 3B: DITEMUKAN';
        this.game.keyHudBadge.classList.add('active-badge');
      }

      // Putar SFX ambil kunci
      this.game.playOneShotSfx('assets/audio/sfx_key_pickup.mp3');

      // Pintu Kamar 304 membanting tertutup rapat (rotation.y = 0) & terkunci otomatis
      this.isRoom304Animating = false;
      this.isRoom304Open = false;
      this.isRoom304TrapLocked = true;
      if (this.room304DoorPivot) {
        this.room304DoorPivot.rotation.y = 0;
      }

      // Camera shake tajam 0.6 detik + sfx_door_slam.mp3
      this.game.cameraShakeDuration = 0.6;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.068;
      this.game.playOneShotSfx('assets/audio/sfx_door_slam.mp3');

      // Pertama-tama jalankan monolog frustrasi Maya memeriksa kunci: maya_examine_key_fix.mp3 (10000ms)
      this.isActionBusy = true;
      this.game.setObjective('Menyeberang ke Ruang Panel 3B di seberang lobi lift untuk membuka kunci magnetik tangga.');

      this._playExactTimedMonologue(
        'assets/audio/maya_examine_key_fix.mp3',
        10000,
        'MAYA',
        "Tunggu... ini bukan kunci tangga darurat. Tulisannya 'Ruang Panel 3B'. Ruang utilitas di seberang lobi... kunci magnetik tangga pasti dikontrol dari sana.",
        () => {
          // Dilanjutkan monolog panik pintu terkunci: maya_door_slam.mp3 (10000ms)
          this.isActionBusy = true;
          this._playExactTimedMonologue(
            'assets/audio/maya_door_slam.mp3',
            10000,
            'MAYA',
            'Nggak, buka! Jangan sekarang... dia ada di dalam sini bersamaku...'
          );

          // Munculkan entitas bayangan bermata merah di dalam Kamar 304
          this.game.setPauseAwareTimeout(() => {
            if (this.game.isDisposed) return;
            this._spawnRoom304Entity();
          }, 3500);
        }
      );
    }

    _spawnRoom304Entity() {
      if (!this.roomEntityMesh) return;
      this.roomEntityMesh.position.set(14.85, 0, -16.25);
      this.roomEntityMesh.visible = true;
      this.isRoom304EntityActive = true;
      this.room304BlinkCount = 0;
      this.game.setObjective('Jangan tatap mata merahnya! Palingkan pandangan lalu tekan [SPACE] 2x untuk berkedip.');
    }

    /**
     * Ketika Maya menekan [Spacebar] untuk berkedip:
     * - Di Kamar 304: posisi sepasang mata merah berpindah sekejap mendekat/bergeser sudutnya
     *   diiringi audio desis dingin sfx_entity_breathing_dark.mp3. Pada kedipan ke-2, entitas lenyap.
     * - Di Koridor Luar: jika entitas mata merah koridor aktif, posisinya juga bergeser diiringi
     *   sfx_entity_breathing_dark.mp3.
     */
    onPlayerBlink() {
      // Menekan [Spacebar] untuk berkedip mereset tingkat agresivitas tatapan fatal monster!
      this.gazeLockTimer = 0;
      this._setFatalGazeOverlayState('none', 0);

      if (this.isStalkerEntityActive && this.stalkerShadowEntity && this.stalkerShadowEntity.visible) {
        this.game.playOneShotSfx('assets/audio/sfx_entity_breathing_dark.mp3');
        const shiftX = (Math.random() - 0.5) * 1.3;
        this.stalkerShadowEntity.position.x = Math.max(1.8, Math.min(8.8, this.stalkerShadowEntity.position.x + shiftX));
      }

      if (this.isCorridorRedEyesActive && this.corridorRedEyesEntity && this.corridorRedEyesEntity.visible) {
        this.game.playOneShotSfx('assets/audio/sfx_entity_breathing_dark.mp3');
        // Geser sudut/posisi mata merah di koridor sekejap saat mata tertutup
        const offsetX = (Math.random() - 0.5) * 1.4;
        this.corridorRedEyesEntity.position.x = 6.4 + offsetX;
        this.corridorRedEyesEntity.position.z = Math.max(-13.8, this.corridorRedEyesEntity.position.z - 0.65);
      }

      if (!this.isRoom304EntityActive) return;

      if (this.isLookingAtRoomEntity) {
        this.game.showTemporarySubtitle(
          'PERINGATAN',
          'Jangan menatap mata merah itu! Palingkan pandangan ke lantai/samping lalu tekan [SPACE]!',
          2200
        );
        return;
      }

      this.room304BlinkCount += 1;
      // Putar audio desis dingin saat entitas berpindah posisi ketika berkedip
      this.game.playOneShotSfx('assets/audio/sfx_entity_breathing_dark.mp3');

      if (this.room304BlinkCount === 1) {
        // Kedipan ke-1: posisi sepasang mata merah berpindah sekejap mendekat & bergeser sudutnya
        if (this.roomEntityMesh) {
          this.roomEntityMesh.position.set(14.25, 0, -16.85);
          this.roomEntityHeadWorldPos.set(14.25, 2.06, -16.85);
        }
        this.game.setObjective('Kedip sekali lagi [SPACE] sambil tetap memalingkan pandangan (1/2)!');
      } else if (this.room304BlinkCount >= 2) {
        this._resolveRoom304EntityEncounter();
      }
    }

    _resolveRoom304EntityEncounter() {
      this.isRoom304EntityActive = false;
      this.isLookingAtRoomEntity = false;
      this._stopStaticBuzz();

      if (this.game.vignetteLayerEl) {
        this.game.vignetteLayerEl.classList.remove('whisper-terror-vignette');
      }

      this.game.playOneShotSfx('assets/audio/sfx_entity_screech_short.mp3');

      if (this.roomEntityMesh) {
        this.roomEntityMesh.visible = false;
      }

      // Pintu Kamar 304 terbuka kembali sedikit (unlocked)
      this.isRoom304TrapLocked = false;
      this.isRoom304Open = true;
      this.room304TargetAngle = 0.65;
      if (this.room304DoorPivot) {
        this.room304DoorPivot.rotation.y = 0.65;
      }

      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.isActionBusy = true;
        this.game.setObjective('Menyeberang ke Ruang Panel 3B di seberang lobi lift untuk membuka kunci magnetik tangga.');
        this._playExactTimedMonologue(
          'assets/audio/maya_got_key.mp3',
          8000,
          'MAYA',
          'Kunci tangga darurat! Aku harus keluar dari kamar ini sekarang juga.'
        );
      }, 650);
    }

    /**
     * Kemunculan Mata Merah di Koridor Luar saat pemain melangkah keluar Kamar 304
     */
    _triggerCorridorRedEyesEvent() {
      if (this.hasTriggeredCorridorRedEyes || this.game.isDisposed) return;
      this.hasTriggeredCorridorRedEyes = true;
      this.isCorridorRedEyesActive = true;

      // 1. Lampu darurat lobi tiba-tiba padam berderak
      if (this.lobbyNeonLight) {
        this.lobbyNeonLight.intensity = 0.08;
      }
      if (this.lobbyNeonMat) {
        this.lobbyNeonMat.emissiveIntensity = 0.02;
      }
      this.lobbyEmergencyLights.forEach((item) => {
        item.light.intensity = 0.05;
        item.lensMat.emissiveIntensity = 0.08;
      });

      // 2. Di ujung lorong seberang dekat pintu lift, muncul sepasang mata merah menyala menatap dingin ke arah Maya
      if (this.corridorRedEyesEntity) {
        this.corridorRedEyesEntity.position.set(6.4, 0, -11.4);
        this.corridorRedEyesEntity.visible = true;
      }

      // 3. Putar audio SFX atmosferik: assets/audio/sfx_red_eyes_appear.mp3
      this.game.playOneShotSfx('assets/audio/sfx_red_eyes_appear.mp3');

      // 4. Jalankan monolog bisikan Maya (maya_spot_red_eyes.mp3 — durasi presisi 12000ms, isMayaSpeaking = true)
      this.isActionBusy = true;
      this._playExactTimedMonologue(
        'assets/audio/maya_spot_red_eyes.mp3',
        12000,
        'MAYA [BERBISIK]',
        'Mata itu... menyala di kegelapan. Jangan tatap langsung. Jangan buat suara sedikit pun.',
        () => {
          this.game.setObjective('Menyeberang ke Ruang Panel 3B di seberang lobi lift untuk membuka kunci magnetik tangga.');
        }
      );
    }

    /**
     * Interaksi Pintu Ruang Panel 3B ("MAINTENANCE 3B - AUTHORIZED PERSONNEL ONLY")
     */
    _interactMaintenance3BDoor() {
      if (this.isMaintenance3BOpen || this.isMaintenance3BAnimating) return;

      if (!this.hasMaintenanceKey) {
        this.game._playProceduralClickSfx(95);
        this.game.showTemporarySubtitle(
          'MAYA',
          'Pintunya terkunci rapat. Bertuliskan "MAINTENANCE 3B - AUTHORIZED PERSONNEL ONLY". Aku butuh kuncinya.',
          3500
        );
        return;
      }

      // Buka kunci pintu Maintenance 3B
      this.isMaintenance3BAnimating = true;
      this.maintenance3BAnimStart = performance.now();
      this.game.playOneShotSfx('assets/audio/sfx_key_pickup.mp3');
      this.game._setInteractionPrompt('');

      // Lenyapkan entitas mata merah di lobi saat Maya berhasil masuk ke Ruang Panel 3B
      if (this.corridorRedEyesEntity) {
        this.corridorRedEyesEntity.visible = false;
        this.isCorridorRedEyesActive = false;
      }

      this.game.showTemporarySubtitle(
        'MAYA',
        'Kunci Ruang Panel 3B cocok! Pintunya terbuka.',
        3500
      );
      this.game.setObjective('Masuk ke dalam Ruang Panel 3B dan aktifkan sakelar pembuka kunci magnetik tangga darurat.');
    }

    /**
     * Membuat elemen DOM overlay untuk peringatan distorsi kromatik/vignette merah tajam
     * dan layar Jumpscare Game Over hitam berdarah saat Tatapan Fatal (> 0.8 detik).
     */
    _ensureFatalGazeOverlayDOM() {
      if (this.fatalGazeOverlayEl) return;
      let el = document.getElementById('fatal-gaze-overlay');
      if (!el) {
        el = document.createElement('div');
        el.id = 'fatal-gaze-overlay';
        el.style.cssText = [
          'position:fixed',
          'inset:0',
          'pointer-events:none',
          'z-index:920',
          'opacity:0',
          'transition:opacity 0.12s ease',
          'display:flex',
          'flex-direction:column',
          'align-items:center',
          'justify-content:center',
          'text-align:center',
          'font-family:"Cinzel",serif'
        ].join(';');
        el.innerHTML = '<div id="fatal-gaze-text" style="color:#ff1a1a;font-size:1.75rem;letter-spacing:0.18em;text-shadow:0 0 18px #ff0000, -3px 0 #ff0044, 3px 0 #00e5ff;opacity:0;padding:0 24px;">JANGAN TATAP MATA MERAHNYA</div>';
        document.body.appendChild(el);
      }
      this.fatalGazeOverlayEl = el;
    }

    _setFatalGazeOverlayState(mode, intensity) {
      this._ensureFatalGazeOverlayDOM();
      if (!this.fatalGazeOverlayEl) return;
      const textEl = document.getElementById('fatal-gaze-text');

      if (mode === 'none') {
        this.fatalGazeOverlayEl.style.opacity = '0';
        this.fatalGazeOverlayEl.style.background = 'transparent';
        this.fatalGazeOverlayEl.style.boxShadow = 'none';
        if (textEl) textEl.style.opacity = '0';
      } else if (mode === 'warning') {
        const alpha = Math.min(0.95, 0.35 + intensity * 0.65);
        this.fatalGazeOverlayEl.style.opacity = String(alpha);
        this.fatalGazeOverlayEl.style.background =
          'radial-gradient(circle, rgba(255,0,20,0.08) 32%, rgba(165,0,15,0.68) 78%, rgba(65,0,0,0.94) 100%)';
        this.fatalGazeOverlayEl.style.boxShadow =
          'inset 0 0 95px rgba(255, 0, 0, 0.85), inset -6px 0 18px rgba(255,0,60,0.55), inset 6px 0 18px rgba(0,220,255,0.38)';
        if (textEl) {
          textEl.textContent = 'TUNDUKKAN KEPALA — JANGAN TATAP MATANYA!';
          textEl.style.fontSize = '1.15rem';
          textEl.style.opacity = String(Math.min(1, intensity * 1.15));
        }
      } else if (mode === 'gameover') {
        this.fatalGazeOverlayEl.style.opacity = '1';
        this.fatalGazeOverlayEl.style.background =
          'radial-gradient(circle, rgba(120,0,0,0.92) 15%, rgba(28,0,0,0.98) 60%, #020000 100%)';
        this.fatalGazeOverlayEl.style.boxShadow = 'inset 0 0 160px #ff0000';
        if (textEl) {
          textEl.innerHTML = 'TATAPAN FATAL<br><span style="font-size:0.95rem;letter-spacing:0.12em;color:#fca5a5;">MEMULIHKAN DARI CHECKPOINT TERDEKAT...</span>';
          textEl.style.fontSize = '2.1rem';
          textEl.style.opacity = '1';
        }
      }
    }

    /**
     * 2. Mekanik Tatapan Fatal (Fatal Gaze Attack System):
     * - Menghitung sudut arah pandang kamera (camera.getWorldDirection) terhadap posisi sepasang mata merah entitas.
     * - Jika dot product terpusat pada mata merah (> 0.88) dan kamera tidak menunduk ke lantai:
     *   * Putar peringatan sfx_eye_lock_warning.mp3, layar bergetar, dan muncul distorsi kromatik/vignette merah tajam.
     *   * Jika terus menatap > 0.8 detik tanpa memalingkan pandangan:
     *     Monster beralih ke Fase Serangan Agresif (The Charge), putar sfx_creature_attack_scream.mp3,
     *     melesat instan ke wajah pemain, layar menjadi hitam berdarah (Jumpscare Game Over), lalu reset ke checkpoint terdekat.
     *   * Saat pertama kali memicu deteksi tatapan dan berhasil memalingkan pandangan tepat waktu:
     *     Putar monolog bisikan Maya: maya_stare_warning.mp3 (10000ms, isMayaSpeaking = true).
     */
    _updateEntityGazeCheck(delta, elapsed) {
      const THREE = window.THREE;
      const camPos = this.game.camera ? this.game.camera.position : null;
      if (!camPos) return;

      // Simpan checkpoint terdekat secara berkala saat aman
      if (!this.isFatalAttackInProgress && this.gazeLockTimer === 0) {
        if (this.isGeneratorRunning && camPos.z > -22.5) {
          this.lastCheckpoint = { x: 2.9, y: 1.68, z: -18.2, yaw: 0 };
        } else if (camPos.z < -35.0) {
          this.lastCheckpoint = { x: 3.9, y: -2.72, z: -37.2, yaw: 0 };
        } else if (this.isRoom304EntityActive) {
          this.lastCheckpoint = { x: 15.6, y: 1.68, z: -17.6, yaw: Math.PI };
        }
      }

      // Jika sedang dalam Fase Serangan Agresif (The Charge), animasikan entitas melesat ke wajah pemain
      if (this.isFatalAttackInProgress) {
        this.fatalAttackTimer += delta;
        if (this.fatalAttackEntity && this.game.camera) {
          const forward = new THREE.Vector3();
          this.game.camera.getWorldDirection(forward);
          forward.y = 0;
          if (forward.lengthSq() > 0.001) forward.normalize();
          const targetX = camPos.x + forward.x * 0.52;
          const targetZ = camPos.z + forward.z * 0.52;
          const targetY = camPos.y - 2.02;
          this.fatalAttackEntity.position.x += (targetX - this.fatalAttackEntity.position.x) * Math.min(1, delta * 26);
          this.fatalAttackEntity.position.y += (targetY - this.fatalAttackEntity.position.y) * Math.min(1, delta * 26);
          this.fatalAttackEntity.position.z += (targetZ - this.fatalAttackEntity.position.z) * Math.min(1, delta * 26);
          this.fatalAttackEntity.lookAt(camPos.x, this.fatalAttackEntity.position.y + 2.06, camPos.z);
        }
        return;
      }

      // Kumpulkan daftar entitas bayangan bermata merah yang sedang aktif & terlihat
      const activeEntities = [];
      if (!this.isOnFloorTwo) {
        if (this.roomEntityMesh && this.roomEntityMesh.visible && this.isRoom304EntityActive) {
          activeEntities.push(this.roomEntityMesh);
        }
        if (this.corridorRedEyesEntity && this.corridorRedEyesEntity.visible && this.isCorridorRedEyesActive) {
          activeEntities.push(this.corridorRedEyesEntity);
        }
        if (this.stalkerShadowEntity && this.stalkerShadowEntity.visible && this.isStalkerEntityActive) {
          activeEntities.push(this.stalkerShadowEntity);
        }
      } else {
        if (this.floor2ReflectionEntity && this.floor2ReflectionEntity.visible) {
          activeEntities.push(this.floor2ReflectionEntity);
        }
        if (this.floor2ChaseEntity && this.floor2ChaseEntity.visible && this.isFloor2WaterChaseActive) {
          activeEntities.push(this.floor2ChaseEntity);
        }
        if (this.floor1LobbyEntity && this.floor1LobbyEntity.visible) {
          activeEntities.push(this.floor1LobbyEntity);
        }
      }

      activeEntities.forEach((ent) => {
        updateShadowEntityVertices(ent, elapsed);
        ent.lookAt(camPos.x, ent.position.y, camPos.z);
      });

      if (activeEntities.length === 0) {
        if (this.gazeLockTimer > 0) {
          this.gazeLockTimer = 0;
          this._setFatalGazeOverlayState('none', 0);
          this._stopStaticBuzz();
        }
        return;
      }

      const camDir = new THREE.Vector3();
      this.game.camera.getWorldDirection(camDir);

      // Cari entitas aktif yang paling terpusat di reticle pandangan pemain
      let bestDot = -1;
      let targetEntity = null;
      for (let i = 0; i < activeEntities.length; i++) {
        const ent = activeEntities[i];
        const eyeWorldPos = new THREE.Vector3(ent.position.x, ent.position.y + 2.06, ent.position.z);
        const dist = camPos.distanceTo(eyeWorldPos);
        if (dist > 15.5) continue;

        const toEyes = eyeWorldPos.sub(camPos).normalize();
        const d = camDir.dot(toEyes);
        if (d > bestDot) {
          bestDot = d;
          targetEntity = ent;
        }
      }

      // 5. SISTEM PANTULAN AIR (WATER REFLECTION HAZARD) DI LANTAI 2:
      // Jika pemain menunduk di dekat entitas Koridor Utara Lantai 2 tetapi kursor kamera tepat menatap
      // pantulan sepasang mata merah di permukaan air (waterReflectionEyesGroup), peringatan tatapan terpicu!
      let isLookingAtWaterReflection = false;
      if (
        this.isOnFloorTwo &&
        this.floor2ReflectionEntity &&
        this.floor2ReflectionEntity.visible &&
        this.waterReflectionEyesGroup
      ) {
        // Posisi pantulan mengikuti titik tengah optik di permukaan air di depan monster
        const entPos = this.floor2ReflectionEntity.position;
        const reflX = entPos.x - 1.15;
        const reflZ = entPos.z;
        this.waterReflectionEyesGroup.position.set(reflX, 0.085, reflZ);

        const reflWorldPos = new THREE.Vector3(reflX, 0.085, reflZ);
        const distToRefl = camPos.distanceTo(reflWorldPos);
        if (distToRefl <= 10.5 && camPos.z <= -19.5) {
          const toReflection = reflWorldPos.sub(camPos).normalize();
          const reflDot = camDir.dot(toReflection);
          if (reflDot >= 0.87 && camDir.y < -0.08) {
            isLookingAtWaterReflection = true;
            bestDot = Math.max(bestDot, reflDot);
            targetEntity = this.floor2ReflectionEntity;

            // Saat pertama kali pemain memicu pantulan air ini, putar maya_reflection_warning.mp3 (9000ms)
            if (!this.hasPlayedReflectionWarningMonologue && !this.game.isMayaSpeaking) {
              this.hasPlayedReflectionWarningMonologue = true;
              this.reflectionGraceTimer = 2.2;
              this._playExactTimedMonologue(
                'assets/audio/maya_reflection_warning.mp3',
                9000,
                'MAYA',
                'Tunggu... mata merah itu... memantul di genangan air! Jangan lihat ke arah airnya!'
              );
            }
          }
        }
      }

      if (this.reflectionGraceTimer > 0) {
        this.reflectionGraceTimer = Math.max(0, this.reflectionGraceTimer - delta);
      }

      // Cara Menghindar (Counter-Play): menundukkan kepala ke lantai memutus kontak mata KECUALI menatap pantulan air!
      const isLookingDownAtFloor = (camDir.y < -0.25 || this.game.pitch < -0.25) && !isLookingAtWaterReflection;
      const isEyeLocked = Boolean(targetEntity && bestDot >= 0.86 && !isLookingDownAtFloor);

      if (isEyeLocked) {
        this.isLookingAtRoomEntity = true;
        this.hasTriggeredGazeWarningInSession = true;
        const sprintHazardMult = (this.isOnFloorTwo && this.game.isSprinting) ? 1.65 : 1.0;
        if (this.reflectionGraceTimer <= 0) {
          this.gazeLockTimer += delta * sprintHazardMult;
        }

        // Putar peringatan awal sfx_eye_lock_warning.mp3
        const nowMs = performance.now();
        if (nowMs - this.lastEyeLockWarningAt > 1350) {
          this.lastEyeLockWarningAt = nowMs;
          this.game.playOneShotSfx('assets/audio/sfx_eye_lock_warning.mp3');
        }

        // Layar bergetar & muncul distorsi kromatik / vignette merah tajam
        if (this.game.vignetteLayerEl) {
          this.game.vignetteLayerEl.classList.add('whisper-terror-vignette');
        }
        this.game.camera.rotation.z = (Math.random() - 0.5) * 0.055;
        this._setFatalGazeOverlayState('warning', Math.min(1, this.gazeLockTimer / 0.8));
        this._startOrUpdateStaticBuzz(Math.min(1, (bestDot - 0.82) * 6.0));

        // Jika pemain terus menatap selama lebih dari 0.8 detik tanpa memalingkan pandangan -> SERANGAN FATAL!
        if (this.gazeLockTimer >= 0.8) {
          this._triggerFatalGazeAttack(targetEntity);
        }
      } else {
        // Jika baru saja memicu peringatan tatapan pertama kali dan berhasil memalingkan pandangan tepat waktu:
        if (
          this.hasTriggeredGazeWarningInSession &&
          !this.hasPlayedStareWarningMonologue &&
          this.gazeLockTimer > 0.06 &&
          !this.game.isMayaSpeaking
        ) {
          this.hasPlayedStareWarningMonologue = true;
          this._playExactTimedMonologue(
            'assets/audio/maya_stare_warning.mp3',
            10000,
            'MAYA [BERBISIK]',
            'Dia bereaksi pada mataku... tundukkan kepala. Jangan tatap wajahnya, lihat ke lantai!'
          );
        }

        this.isLookingAtRoomEntity = false;
        this.gazeLockTimer = Math.max(0, this.gazeLockTimer - delta * 2.8);
        if (this.gazeLockTimer <= 0.01) {
          this.gazeLockTimer = 0;
          this._setFatalGazeOverlayState('none', 0);
          if (this.game.vignetteLayerEl) {
            this.game.vignetteLayerEl.classList.remove('whisper-terror-vignette');
          }
          this._stopStaticBuzz();
        } else {
          this._setFatalGazeOverlayState('warning', this.gazeLockTimer / 0.8);
        }
      }
    }

    /**
     * Fase Serangan Agresif (The Charge):
     * - Putar jeritan distorsi ekstrem: assets/audio/sfx_creature_attack_scream.mp3
     * - Entitas melesat instan ke wajah pemain, layar menjadi hitam berdarah (Jumpscare Game Over),
     *   lalu sistem mereset posisi pemain ke checkpoint terdekat.
     */
    _triggerFatalGazeAttack(entity) {
      if (this.isFatalAttackInProgress) return;
      this.isFatalAttackInProgress = true;
      this.fatalAttackTimer = 0;
      this.fatalAttackEntity = entity;
      this.isCutsceneLocked = true;
      this._stopStaticBuzz();

      // Putar jeritan distorsi ekstrem: assets/audio/sfx_creature_attack_scream.mp3
      this.game.playOneShotSfx('assets/audio/sfx_creature_attack_scream.mp3');

      // Guncang kamera hebat & aktifkan layar Jumpscare Game Over hitam berdarah
      this.game.cameraShakeDuration = 0.9;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.11;

      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this._setFatalGazeOverlayState('gameover', 1.0);
      }, 160);

      // Reset posisi pemain ke checkpoint terdekat setelah 2.4 detik
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this._respawnFromFatalGaze();
      }, 2400);
    }

    _respawnFromFatalGaze() {
      this.isFatalAttackInProgress = false;
      this.isCutsceneLocked = false;
      this.isActionBusy = false;
      if (this.game && typeof this.game.setMayaSpeaking === 'function') {
        this.game.setMayaSpeaking(false);
      }
      this.gazeLockTimer = 0;
      this._setFatalGazeOverlayState('none', 0);
      if (this.game.vignetteLayerEl) {
        this.game.vignetteLayerEl.classList.remove('whisper-terror-vignette');
      }

      // Kembalikan posisi entitas ke titik awalnya agar tidak menempel di wajah pemain
      if (this.roomEntityMesh && this.isRoom304EntityActive) {
        this.roomEntityMesh.position.set(14.85, 0, -16.25);
      }
      if (this.corridorRedEyesEntity && this.isCorridorRedEyesActive) {
        this.corridorRedEyesEntity.position.set(6.4, 0, -11.4);
      }
      if (this.stalkerShadowEntity && this.isStalkerEntityActive) {
        this.stalkerShadowEntity.position.set(5.4, 0, -13.2);
      }

      // Reset kamera pemain ke checkpoint terdekat sambil menundukkan pandangan sedikit ke lantai (-0.32 rad)
      if (this.game.camera && this.lastCheckpoint) {
        this.game.camera.position.set(
          this.lastCheckpoint.x,
          this.lastCheckpoint.y,
          this.lastCheckpoint.z
        );
        this.game.yaw = this.lastCheckpoint.yaw || 0;
        this.game.pitch = -0.32;
        this.game.camera.rotation.y = this.game.yaw;
        this.game.camera.rotation.x = this.game.pitch;
        this.game.camera.rotation.z = 0;
      }

      this.game.showTemporarySubtitle(
        'CHECKPOINT',
        'Jangan menatap mata merahnya! Tundukkan pandangan ke lantai atau tekan [SPACE] untuk berkedip.',
        4000
      );
    }

    /**
     * 3. Sekuens Membuka Pintu Lift Lobi Lantai 3 (sfx_elevator_bell.mp3)
     */
    _openPoweredLobbyElevator() {
      if (this.isElevatorDoorSequenceTriggered || this.isOnFloorTwo) return;
      this.isElevatorDoorSequenceTriggered = true;
      this.isElevatorCabinOpen = true;
      this.targetElevatorDoorFactor = 1.0;

      // Putar denting pintu lift: assets/audio/sfx_elevator_bell.mp3
      this.game.playOneShotSfx('assets/audio/sfx_elevator_bell.mp3');
      this.game._setInteractionPrompt('');

      // Sembunyikan entitas pengintai di lobi saat pintu lift terbuka
      if (this.stalkerShadowEntity) {
        this.stalkerShadowEntity.visible = false;
        this.isStalkerEntityActive = false;
      }
      if (this.corridorRedEyesEntity) {
        this.corridorRedEyesEntity.visible = false;
        this.isCorridorRedEyesActive = false;
      }

      this.game.setObjective('Masuk ke dalam kabin lift dan tekan tombol panel lantai dasar [E].');
    }

    /**
     * 3B & 4. Menekan Tombol Panel Lantai Dasar [E] di Dalam Kabin Lift
     * -> Monolog Lega Maya (maya_elevator_enter.mp3 — 12000ms)
     * -> Sekuens Lift Macet & Anjlok ke Lantai 2 (sfx_elevator_cable_snap.mp3 + maya_elevator_crash.mp3 — 7000ms)
     */
    _activateElevatorCabinDescentAndCrash() {
      if (this.isElevatorDescending || this.isOnFloorTwo || this.game.isMayaSpeaking) return;
      this.isElevatorDescending = true;
      this.isInsideElevatorCabin = true;
      this.isActionBusy = true;
      this.game._setInteractionPrompt('');

      // Posisikan pemain rapi di dalam kabin lift menghadap pintu lift
      if (this.game.camera) {
        this.game.camera.position.set(7.9, 1.68, -8.65);
        this.game.yaw = 0;
        this.game.pitch = 0;
        this.game.camera.rotation.y = 0;
        this.game.camera.rotation.x = 0;
      }

      // Pintu lift menutup rapat
      this.targetElevatorDoorFactor = 0.0;
      this.game._playProceduralClickSfx(320);

      // Putar monolog lega Maya: assets/audio/maya_elevator_enter.mp3 (Durasi presisi: 12000ms)
      this.game.setObjective('Tunggu lift turun menuju lantai dasar...');
      this._playExactTimedMonologue(
        'assets/audio/maya_elevator_enter.mp3',
        12000,
        'MAYA',
        'Panelnya menyala! Lantai satu... kumohon bawa aku ke lantai dasar.',
        () => {
          // 4. Tepat di akhir monolog maya_elevator_enter: Sekuens Lift Macet & Anjlok ke Lantai 2!
          this._triggerElevatorCableSnapAndCrashToFloorTwo();
        }
      );
    }

    _triggerElevatorCableSnapAndCrashToFloorTwo() {
      if (this.game.isDisposed) return;
      this.isActionBusy = true;

      // 1. Lampu neon di dalam kabin lift berkedip padam dan berubah menjadi lampu darurat merah redup
      if (this.cabinNeonLight) {
        this.cabinNeonLight.intensity = 0;
      }
      if (this.cabinNeonMat) {
        this.cabinNeonMat.emissive.setHex(0x330505);
        this.cabinNeonMat.emissiveIntensity = 0.08;
      }
      if (this.cabinEmergencyLight) {
        this.cabinEmergencyLight.intensity = 1.45;
      }

      // 2. Putar audio efek kabel meregang dan benturan keras: assets/audio/sfx_elevator_cable_snap.mp3
      this.game.playOneShotSfx('assets/audio/sfx_elevator_cable_snap.mp3');

      // 3. Guncang kamera hebat selama 1.2 detik
      this.game.cameraShakeDuration = 1.2;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.095;

      // 4. Kabin tersentak anjlok dan terhenti mendadak di Lantai 2
      this.isElevatorDescending = false;
      this.isOnFloorTwo = true;
      this._updateCabinFloorDisplay('2', '#ef4444');

      // Sembunyikan seluruh geometri Kamar & Lorong Lantai 3 serta aktifkan Lantai 2 & Lantai 1
      if (this.floorThreeRootGroup) {
        this.floorThreeRootGroup.visible = false;
      }
      if (this.game && this.game.floorThreeBedroomGroup) {
        this.game.floorThreeBedroomGroup.visible = false;
      }
      if (this.game && this.game.ceilingLight) {
        this.game.ceilingLight.visible = false;
      }
      if (this.game && this.game.hallwayNeonLight) {
        this.game.hallwayNeonLight.visible = false;
      }
      if (this.game && this.game.cornerEmergencyLight) {
        this.game.cornerEmergencyLight.visible = false;
      }
      if (this.floorTwoGroup) {
        this.floorTwoGroup.visible = true;
      }
      this.lastCheckpoint = { x: 7.9, y: 1.68, z: -8.65, yaw: 0 };

      // 5. Pintu kabin lift yang anjlok macet dan hanya terbuka setinggi 50 cm di bagian bawah!
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.targetElevatorDoorFactor = 0.55;
        if (this.elevatorJammedShutterMesh) {
          this.elevatorJammedShutterMesh.visible = true;
          this.elevatorJammedShutterMesh.position.y = 1.40; // Menyisakan celah bawah 50 cm (y = 0.0 s/d 0.52m)
        }
      }, 450);

      // 6. Maya panik dan terbatuk: putar maya_elevator_crash.mp3 (Durasi presisi: 7000ms)
      this._playExactTimedMonologue(
        'assets/audio/maya_elevator_crash.mp3',
        7000,
        'MAYA',
        '[berteriak] Nggak, jangan! Kabelnya! [batuk] Pintunya terbuka... ini lantai berapa?!',
        () => {
          // 7. Perbarui objektif di HUD: merayap lewat bawah pintu lift [SHIFT / C]
          this.game.setObjective('Tekan [SHIFT] atau [C] untuk jongkok dan merayap keluar dari celah pintu lift (50 cm).');
        }
      );
    }

    /**
     * 2. Sekuens Merayap Keluar Lift ke Genangan Air Lantai 2 (maya_floor2_enter.mp3 — 13000ms)
     */
    _triggerFloor2CrawlExitSequence() {
      if (this.hasTriggeredFloor2EnterMonologue || this.game.isDisposed) return;
      this.hasTriggeredFloor2EnterMonologue = true;
      this.hasCrawledOutOfElevator = true;
      this.isActionBusy = true;

      this.game.playOneShotSfx('assets/audio/sfx_water_footsteps.mp3');
      this.lastCheckpoint = { x: 7.9, y: 1.68, z: -11.1, yaw: Math.PI / 2 };

      this.game.setObjective('Cari jalan keluar dan periksa pintu tangga darurat Lantai 2.');
      this._playExactTimedMonologue(
        'assets/audio/maya_floor2_enter.mp3',
        13000,
        'MAYA',
        'Air... seluruh lantai ini tergenang. Baunya menyengat sekali. Aku harus merayap lewat bawah pintu ini.'
      );
    }

    /**
     * 3A. Interaksi Gembok Kombinasi 3 Angka (padlockMesh) pada Pintu Tangga Darurat Lantai 2
     */
    _interactFloor2Padlock() {
      if (this.isPadlockUnlocked || this.isFloor2StairDoorSlammedSafe || this.game.isMayaSpeaking) return;

      if (!this.hasFullPadlockCode && !(this.hasDigit7 && this.hasDigits42)) {
        this.game._playProceduralClickSfx(140);
        this.game.showTemporarySubtitle(
          'PINTU TANGGA DARURAT',
          'Terkunci gembok kombinasi 3 angka. Butuh kode untuk membukanya.',
          3800
        );
        return;
      }

      // Kode 7-4-2 lengkap dimiliki! Buka gembok kombinasi & lepas rantai besi ke air
      this.isPadlockUnlocked = true;
      this.isChainsFalling = true;
      this.chainsFallTimer = 0;
      this.isActionBusy = true;
      this.game._setInteractionPrompt('');

      // 1. Putar audio interaksi gembok: assets/audio/sfx_padlock_click.mp3
      this.game.playOneShotSfx('assets/audio/sfx_padlock_click.mp3');

      // 2. Ayunkan pintu tangga darurat terbuka setelah gembok & rantai jatuh ke air (~850ms)
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.isFloor2StairDoorAnimating = true;
        this.floor2StairDoorAnimStart = performance.now();
        this.isFloor2StairDoorOpen = true;
      }, 850);

      // 3. Putar monolog lega terburu-buru: assets/audio/maya_padlock_solve.mp3 (Durasi presisi: 10000ms)
      this._playExactTimedMonologue(
        'assets/audio/maya_padlock_solve.mp3',
        10000,
        'MAYA',
        'Tujuh... empat... dua. Ayo terbuka! Ya! Berhasil!',
        () => {
          this.game.setObjective('Lari masuk ke bordes tangga darurat sekarang juga!');
        }
      );

      // 4. Sekuens Pengejaran Air (Water Dash Scare): Entitas melesat mengejar dari genangan air di belakang pemain!
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed || this.isFloor2StairDoorSlammedSafe) return;
        this._startFloor2WaterDashChase();
      }, 1600);
    }

    _startFloor2WaterDashChase() {
      if (this.isFloor2WaterChaseActive || this.isFloor2StairDoorSlammedSafe) return;
      this.isFloor2WaterChaseActive = true;

      if (this.floor2ChaseEntity) {
        this.floor2ChaseEntity.position.set(13.2, 0, -11.1);
        this.floor2ChaseEntity.visible = true;
      }

      // Putar SFX langkah air kencang: assets/audio/sfx_water_dash_chase.mp3
      this.game.playOneShotSfx('assets/audio/sfx_water_dash_chase.mp3');
      this.game.cameraShakeDuration = 0.65;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.045;
    }

    /**
     * Saat pemain melangkah masuk ke bordes tangga darurat Lantai 2 (x <= 3.75),
     * pintu besi terbanting menutup rapat, mengunci entitas di luar!
     */
    _slamFloor2EmergencyStairDoorSafe() {
      if (this.isFloor2StairDoorSlammedSafe) return;
      this.isFloor2StairDoorSlammedSafe = true;
      this.isFloor2WaterChaseActive = false;
      this.isFloor2StairDoorAnimating = false;

      if (this.floor2StairDoorPivot) {
        this.floor2StairDoorPivot.rotation.y = 0;
      }
      if (this.floor2ChaseEntity) {
        this.floor2ChaseEntity.visible = false;
      }

      this.game.playOneShotSfx('assets/audio/sfx_door_slam.mp3');
      this.game.setPauseAwareTimeout(() => {
        if (!this.game.isDisposed) {
          this.game.playOneShotSfx('assets/audio/sfx_door_thud.mp3');
        }
      }, 320);

      this.game.cameraShakeDuration = 0.65;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.082;

      this.game.showTemporarySubtitle(
        'TANGGA DARURAT LANTAI 2',
        '[ Pintu besi tangga darurat terbanting menutup rapat, mengunci entitas bayangan di luar! ]',
        4500
      );
      this.lastCheckpoint = { x: 2.2, y: 1.68, z: -10.8, yaw: Math.PI };
      this.game.setObjective('Turuni tangga darurat menuju Lantai 1 (Area Staf).');
    }

    /**
     * 1. Membuka Pintu Keluar Darurat "Lantai 1 - Area Staf" di ujung bawah tangga darurat
     */
    _openFloor1StaffEntryDoor() {
      if (this.isFloor1EntryDoorOpen || this.isFloor1EntryDoorAnimating) return;
      this.isFloor1EntryDoorAnimating = true;
      this.floor1EntryDoorAnimStart = performance.now();
      this.isFloor1EntryDoorOpen = true;
      this.isOnFloorOne = true;

      this.game.playOneShotSfx('assets/audio/sfx_door_knock.mp3');
      this.game._setInteractionPrompt('');
      this.lastCheckpoint = { x: 1.9, y: -2.52, z: 2.4, yaw: Math.PI };

      this.game.showTemporarySubtitle(
        'LANTAI 1 - AREA STAF',
        'Koridor staf lantai dasar... kering dan dingin. Ada meja pos keamanan di depan.',
        4200
      );
      this.game.setObjective('Telusuri koridor staf Lantai 1 dan periksa meja pos keamanan.');
    }

    /**
     * 2 & 3. Mengambil Unit Radio HT (radioHTMesh) & Memulai Sekuens Komunikasi Dua Arah Maya & Dhafir
     */
    _pickupRadioHTAndStartDhafirSequence() {
      if (this.hasPickedUpRadioHT || this.isRadioTransmitting || this.game.isMayaSpeaking) return;
      this.hasPickedUpRadioHT = true;
      this.isRadioRinging = false;

      // Putar audio interaksi pengambilan radio: assets/audio/sfx_radio_pickup.mp3
      this.game.playOneShotSfx('assets/audio/sfx_radio_pickup.mp3');

      // Sembunyikan radioHTMesh di atas meja keamanan
      if (this.radioHTMesh) {
        this.radioHTMesh.visible = false;
      }
      this.game._setInteractionPrompt('');

      // Aktifkan ikon / badge Radio HT di pojok HUD
      this.game.hasRadioHT = true;
      this.game._updateEquipmentHUD();

      // Kunci interaksi objek & ponsel secara ketat selama transmisi radio berlangsung
      this.isRadioTransmitting = true;
      this.isActionBusy = true;
      this.game.setRadioTransmitting(true);
      if (this.game.isPhoneOpen) {
        this.game.toggleSmartphone(false);
      }

      this.lastCheckpoint = { x: 1.9, y: -2.52, z: 7.8, yaw: Math.PI };
      this.game.setObjective('Dengarkan transmisi radio dari Dhafir [Interaksi Dikunci].');

      // Mulai sekuens berantai 4 bagian dialog radio Maya & Dhafir setelah sfx_radio_pickup (450ms)
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this._runDhafirMayaRadioChain(0);
      }, 450);
    }

    /**
     * Menjalankan 4 tahap dialog radio Maya & Dhafir secara berurutan (chain sequence)
     * sesuai durasi presisi masing-masing audio (11000ms -> 5000ms -> 11000ms -> 10000ms).
     */
    _runDhafirMayaRadioChain(stepIndex) {
      if (this.game.isDisposed) return;

      if (stepIndex >= DHAFIR_MAYA_RADIO_SEQUENCE.length) {
        // Seluruh 4 bagian dialog selesai:
        this.hasCompletedDhafirRadioDialog = true;
        this.isRadioTransmitting = false;
        this.isActionBusy = false;
        this.game.hideSubtitle();
        this.game.setRadioTransmitting(false);

        // Buka kunci pintu double-door di ujung lorong staf menuju ruang kontrol keamanan / koridor lobi
        this.isFloor1DoubleDoorUnlocked = true;
        this.isFloor1DoubleDoorAnimating = true;
        this.floor1DoubleDoorAnimStart = performance.now();

        if (this.floor1DoubleDoorLockMat) {
          this.floor1DoubleDoorLockMat.color.setHex(0x22c55e);
        }
        if (this.floor1DoubleDoorLockLight) {
          this.floor1DoubleDoorLockLight.color.setHex(0x22c55e);
        }
        if (this.floor1LobbyEntity) {
          this.floor1LobbyEntity.visible = true;
        }

        this.game.playOneShotSfx('assets/audio/sfx_padlock_click.mp3');

        // Perbarui objektif di HUD sesuai spesifikasi
        this.game.setObjective('Ikuti instruksi radio Dhafir menuju ruang kontrol keamanan Lantai 1.');
        return;
      }

      const step = DHAFIR_MAYA_RADIO_SEQUENCE[stepIndex];

      // Kunci interaksi & tampilkan subtitle Bahasa Indonesia
      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      this.game.showSubtitle(step.speaker, step.text, false);

      // 1. Putar SFX transmisi walkie-talkie: assets/audio/sfx_radio_click_chime.mp3
      this.game.playOneShotSfx(step.chimeSfx);

      // 2. Putar voice over sesuai file di assets/audio/
      this.game._playAudioWithFallback(step.file, step.duration, null);

      // 3. Tunggu sesuai durasi presisi (11000ms / 5000ms / 11000ms / 10000ms) sebelum lanjut ke tahap berikutnya
      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
      }
      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;
        this._runDhafirMayaRadioChain(stepIndex + 1);
      }, step.duration);
    }

    /**
     * 3B. Game Over Instan saat Melangkah ke Zona Air Berlistrik (Box3 Trigger Zone)
     */

    /**
     * Pemicu Jebakan Ruang Arsip Lantai 1 (The Panic Archive Trap):
     * - Begitu seluruh badan pemain melangkah masuk melewati ambang pintu (z >= 18.35):
     *   * Pintu hidrolik terbanting menutup otomatis & mengunci jalan kembali ke lorong staf.
     *   * Putar SFX: assets/audio/sfx_door_slam_lock.mp3.
     *   * Kunci magnetik aktif (doorMesh.isLocked = true).
     *   * Mulai rangkaian sekuens audio radio 7 Babak Dhafir & Maya.
     */
    _triggerPanicArchiveTrap() {
      if (this.hasTriggeredArchiveTrap || this.game.isDisposed) return;
      this.hasTriggeredArchiveTrap = true;
      this.isPlayerTrappedInArchive = true;
      this.isArchiveDoorSlamAnimating = true;
      this.archiveDoorSlamStart = performance.now();

      // Aktifkan kunci magnetik pada pintu masuk & keluar ruang arsip
      if (this.archiveDoorMesh) {
        this.archiveDoorMesh.isLocked = true;
      }
      if (this.archiveExitDoorMesh) {
        this.archiveExitDoorMesh.isLocked = true;
      }
      if (this.floor1DoubleDoorLockMat) {
        this.floor1DoubleDoorLockMat.color.setHex(0xef4444);
      }
      if (this.floor1DoubleDoorLockLight) {
        this.floor1DoubleDoorLockLight.color.setHex(0xef4444);
      }

      // Putar SFX pintu hidrolik terbanting mengunci: assets/audio/sfx_door_slam_lock.mp3
      this.game.playOneShotSfx('assets/audio/sfx_door_slam_lock.mp3');

      // Efek guncangan kamera saat pintu baja terbanting menutup
      this.game.cameraShakeDuration = 0.65;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.085;

      // Kunci interaksi objek luar & ponsel secara ketat (namun kamera & gerak di dalam ruangan tetap bebas!)
      this.isRadioTransmitting = true;
      this.isActionBusy = true;
      this.game.setRadioTransmitting(true);
      if (this.game.isPhoneOpen) {
        this.game.toggleSmartphone(false);
      }

      this.lastCheckpoint = { x: 1.9, y: -2.52, z: 20.5, yaw: 0 };
      this.game.setObjective('Terjebak di Ruang Arsip Darurat — Dengarkan transmisi radio Dhafir.');

      // Mulai rangkaian dialog radio 7 Babak (Babak 1 s/d Babak 6) setelah dentuman pintu (650ms)
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this._runPanicArchiveRadioChain(0);
      }, 650);
    }

    /**
     * Menjalankan Rangkaian Dialog Radio Presisi (Babak 1 s/d Babak 6)
     * Setiap pergantian transmisi membunyikan klik PTT assets/audio/sfx_radio_click_chime.mp3.
     */
    _runPanicArchiveRadioChain(index) {
      if (this.game.isDisposed) return;

      if (index >= PANIC_ARCHIVE_RADIO_SEQUENCE.length) {
        this._triggerDhafirHingeGunshotBreach();
        return;
      }

      const item = PANIC_ARCHIVE_RADIO_SEQUENCE[index];

      // Pastikan flag penguncian interaksi aktif ketat selama percakapan berlangsung
      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      this.game.showSubtitle(item.speaker, item.text, false);

      if (item.objectiveOnStart) {
        this.game.setObjective(item.objectiveOnStart);
      }

      if (item.playChime) {
        this.game.playOneShotSfx('assets/audio/sfx_radio_click_chime.mp3');
      }

      this.game._playAudioWithFallback(item.file, item.duration, null);

      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
      }
      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;
        if (item.triggerBreachAfter) {
          this._triggerDhafirHingeGunshotBreach();
        } else {
          this._runPanicArchiveRadioChain(index + 1);
        }
      }, item.duration);
    }

    /**
     * Babak 7: Tembakan Engsel Pintu oleh Dhafir & Pintu Tumbang Terbuka:
     * - Putar SFX tembakan baja: assets/audio/sfx_silenced_gunshots.mp3
     * - Efek guncangan kamera (camera shake) + partikel percikan api & asap pada engsel pintu
     * - Putar SFX pintu roboh: assets/audio/sfx_door_kick_open.mp3
     * - Animasi pintu terbuka/tumbang ke depan & hilangkan collider penghalang pintu
     * - Lanjutkan 3 dialog penutup Babak 7 (maya_cough_smoke -> dhafir_final_push -> maya_final_sprint)
     */
    _triggerDhafirHingeGunshotBreach() {
      if (this.game.isDisposed) return;

      // 1. Putar SFX tembakan baja berperedam: assets/audio/sfx_silenced_gunshots.mp3
      this.game.playOneShotSfx('assets/audio/sfx_silenced_gunshots.mp3');

      // 2. Guncangan kamera & nyalakan percikan api + kepulan asap pada engsel pintu
      this.game.cameraShakeDuration = 1.15;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.095;

      if (this.archiveHingeSparksMat) {
        this.archiveHingeSparksMat.opacity = 1.0;
      }
      if (this.archiveHingeSmokeGroup) {
        this.archiveHingeSmokeGroup.visible = true;
      }
      if (this.archiveBreachFlashLight) {
        this.archiveBreachFlashLight.intensity = 4.2;
      }

      // 3. Setelah tembakan mengenai engsel (550ms), putar sfx_door_kick_open.mp3 & tumbangkan pintu!
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;

        this.game.playOneShotSfx('assets/audio/sfx_door_kick_open.mp3');
        this.game.cameraShakeDuration = 0.75;
        this.game.cameraShakeTimer = 0;
        this.game.cameraShakeIntensity = 0.11;

        // Buka kunci & hilangkan penghalang collider pintu
        this.isArchiveExitBreached = true;
        this.isPlayerTrappedInArchive = false;
        this.isMainLobbyUnlocked = true;
        this.isArchiveBreachAnimating = true;
        this.archiveBreachAnimStart = performance.now();

        if (this.archiveDoorMesh) {
          this.archiveDoorMesh.isLocked = false;
        }
        if (this.archiveExitDoorMesh) {
          this.archiveExitDoorMesh.isLocked = false;
        }
        if (this.floor1LobbyEntity) {
          this.floor1LobbyEntity.visible = true;
        }

        // Lanjutkan dialog Babak 7 (maya_cough_smoke -> dhafir_final_push -> maya_final_sprint)
        this._runPanicArchivePostBreachChain(0);
      }, 550);
    }

    _runPanicArchivePostBreachChain(index) {
      if (this.game.isDisposed) return;

      if (index >= PANIC_ARCHIVE_POST_BREACH_SEQUENCE.length) {
        // Setelah monolog terakhir (maya_final_sprint.mp3 - 10000ms) selesai:
        // 1. Reset flag isRadioTransmitting = false dan isMayaSpeaking = false
        this.isRadioTransmitting = false;
        this.isActionBusy = false;
        this.game.hideSubtitle();
        this.game.setRadioTransmitting(false);

        // 2. Buka akses penuh lorong menuju atrium Lobi Utama & perbarui objektif HUD
        this.isMainLobbyUnlocked = true;
        this.lastCheckpoint = { x: 1.9, y: -2.52, z: 24.8, yaw: Math.PI };
        this.game.setObjective('Lari menembus Lobi Utama menuju pintu keluar kaca sebelum fajar berakhir!');
        return;
      }

      const item = PANIC_ARCHIVE_POST_BREACH_SEQUENCE[index];

      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      this.game.showSubtitle(item.speaker, item.text, false);

      if (item.playChime) {
        this.game.playOneShotSfx('assets/audio/sfx_radio_click_chime.mp3');
      }

      this.game._playAudioWithFallback(item.file, item.duration, null);

      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
      }
      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;
        this._runPanicArchivePostBreachChain(index + 1);
      }, item.duration);
    }

    _triggerMainLobbyDawnEscape() {
      if (this.hasReachedMainLobbyExit || this.isRadioTransmitting || this.game.isMayaSpeaking) return;
      this.hasReachedMainLobbyExit = true;
      this.game.playOneShotSfx('assets/audio/sfx_padlock_click.mp3');
      this.game.showTemporarySubtitle(
        'PELARIAN LOBI UTAMA BERHASIL',
        '[ Maya berhasil menembus pintu kaca Lobi Utama menuju udara fajar dan tim evakuasi Dhafir! ]',
        6000
      );
      this.game.setObjective('SELAMAT — Kamu berhasil keluar dari kompleks Blindspot bersama Dhafir.');
    }

    _triggerElectrocutionGameOver() {
      if (this.isFatalAttackInProgress || this.isCutsceneLocked) return;
      this.isFatalAttackInProgress = true;
      this.isCutsceneLocked = true;

      this.game.playOneShotSfx('assets/audio/sfx_elevator_spark.mp3');
      this.game.cameraShakeDuration = 0.85;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.12;

      this._ensureFatalGazeOverlayDOM();
      if (this.fatalGazeOverlayEl) {
        const textEl = document.getElementById('fatal-gaze-text');
        this.fatalGazeOverlayEl.style.opacity = '1';
        this.fatalGazeOverlayEl.style.background =
          'radial-gradient(circle, rgba(56,189,248,0.85) 15%, rgba(15,23,42,0.96) 65%, #020617 100%)';
        this.fatalGazeOverlayEl.style.boxShadow = 'inset 0 0 160px #38bdf8';
        if (textEl) {
          textEl.innerHTML = 'TERSETRUM ARUS TINGGI<br><span style="font-size:0.95rem;letter-spacing:0.12em;color:#bae6fd;">JANGAN LEWATI AIR BERLISTRIK SEBELUM SEKRING DIMATIKAN!</span>';
          textEl.style.fontSize = '2.0rem';
          textEl.style.opacity = '1';
        }
      }

      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.isFatalAttackInProgress = false;
        this.isCutsceneLocked = false;
        this.isActionBusy = false;
        if (this.game && typeof this.game.setMayaSpeaking === 'function') {
          this.game.setMayaSpeaking(false);
        }
        this._setFatalGazeOverlayState('none', 0);
        if (this.game.camera) {
          this.game.camera.position.set(18.6, this.game.isCrouching ? 0.62 : 1.68, -13.1);
          this.game.yaw = 0;
          this.game.pitch = 0;
          this.game.camera.rotation.set(0, 0, 0);
        }
      }, 2200);
    }

    /**
     * 4A. Membaca Memo Penghuni di Meja Rias Kamar 201
     */
    _inspectRoom201Memo() {
      this.hasReadRoom201Memo = true;
      this.game.playOneShotSfx('assets/audio/sfx_key_pickup.mp3');
      this.game.showTemporarySubtitle(
        'MEMO PENGHUNI KAMAR 201',
        '"Jangan tertipu saat menunduk di lorong banjir! Mata merah makhluk itu memantul di permukaan air. Tembok ke Kamar 203 jebol—kotak sekring ada di sebelah sana."',
        5500
      );
    }

    /**
     * 4B. Mematikan Saklar Kotak Sekring di Kamar 203 (sfx_breaker_off.mp3) & Mencatat Digit Pertama "7"
     */
    _turnOffFloor2Breaker() {
      if (!this.isFloor2BreakerOn || this.isBreakerLeverAnimating || this.game.isMayaSpeaking) return;
      this.isBreakerLeverAnimating = true;
      this.breakerLeverAnimStart = performance.now();
      this.isFloor2BreakerOn = false;
      this.hasDigit7 = true;
      if (this.hasDigits42) {
        this.hasFullPadlockCode = true;
      }

      // Putar audio saklar sekring turun: assets/audio/sfx_breaker_off.mp3
      this.game.playOneShotSfx('assets/audio/sfx_breaker_off.mp3');
      this.game._setInteractionPrompt('');

      // Matikan visual percikan listrik di Koridor Timur
      if (this.electricSparkLight) {
        this.electricSparkLight.intensity = 0;
      }
      if (this.electricArcMat) {
        this.electricArcMat.opacity = 0;
      }

      this.lastCheckpoint = { x: 2.0, y: 1.68, z: -20.5, yaw: -Math.PI / 2 };

      this.game.showTemporarySubtitle(
        'MAYA',
        'Sekring listrik sudah kumatiin! Air di lorong timur aman sekarang... dan ada angka "7" tercakar di dinding samping sekring ini.',
        5200
      );
      this.game.setObjective(
        this.hasFullPadlockCode
          ? 'Kembali ke tangga darurat dan buka gembok kombinasi (7-4-2).'
          : 'Seberangi lorong yang kini aman dari listrik menuju Kamar 205 untuk mencari sisa kode gembok (7 - ? - ?).'
      );
    }

    _inspectWallDigit7() {
      this.hasDigit7 = true;
      if (this.hasDigits42) {
        this.hasFullPadlockCode = true;
      }
      this.game._playProceduralClickSfx(240);
      this.game.showTemporarySubtitle(
        'MAYA',
        'Angka "7" tercakar dalam di dinding samping kotak sekring. Ini pasti digit pertama gembok tangga darurat!',
        4200
      );
    }

    /**
     * 5B. Memeriksa Papan Memo Inventaris di Kamar 205 (Gudang Servis: Digit "4 - 2")
     */
    _inspectRoom205Memo() {
      this.hasDigits42 = true;
      this.hasDigit7 = true;
      this.hasFullPadlockCode = true;

      this.game.playOneShotSfx('assets/audio/sfx_key_pickup.mp3');
      this.lastCheckpoint = { x: 18.6, y: 1.68, z: -25.2, yaw: 0 };

      if (this.game.keyHudBadge) {
        this.game.keyHudBadge.textContent = 'KODE GEMBOK: 7 - 4 - 2';
        this.game.keyHudBadge.classList.add('active-badge');
      }

      this.game.showTemporarySubtitle(
        'MAYA',
        'Papan memo inventaris: "4 - 2"! Digabung dengan angka 7 di ruang sekring tadi... kodenya 7 - 4 - 2! Aku harus kembali ke pintu tangga darurat!',
        5500
      );
      this.game.setObjective('Kembali ke tangga darurat dan buka gembok kombinasi (7-4-2).');
    }

    _startOrUpdateStaticBuzz(intensityFactor) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      try {
        if (!this.game._sfxCtx) {
          this.game._sfxCtx = new AudioCtx();
        }
        const ctx = this.game._sfxCtx;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        if (!this.staticBuzzOsc) {
          this.staticBuzzOsc = ctx.createOscillator();
          this.staticBuzzGain = ctx.createGain();
          this.staticBuzzOsc.type = 'sawtooth';
          this.staticBuzzOsc.frequency.setValueAtTime(92, ctx.currentTime);
          this.staticBuzzGain.gain.setValueAtTime(0.01, ctx.currentTime);
          this.staticBuzzOsc.connect(this.staticBuzzGain);
          this.staticBuzzGain.connect(ctx.destination);
          this.staticBuzzOsc.start();
        }

        const vol = Math.min(0.28, Math.max(0.04, intensityFactor * 0.22)) * this.game._getEffectiveVolume();
        this.staticBuzzGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
        this.staticBuzzOsc.frequency.setTargetAtTime(88 + Math.random() * 65, ctx.currentTime, 0.04);
      } catch (_) {}
    }

    _stopStaticBuzz() {
      if (this.staticBuzzOsc) {
        try {
          this.staticBuzzOsc.stop();
          this.staticBuzzOsc.disconnect();
        } catch (_) {}
        this.staticBuzzOsc = null;
        this.staticBuzzGain = null;
      }
    }

    update(delta, elapsed) {
      const camPos = this.game.camera ? this.game.camera.position : null;

      // 1. Subtle Fluorescent Pulse pada Lampu Neon Langit-Langit Lobi (jika belum padam oleh event Mata Merah)
      if (this.lobbyNeonLight && this.lobbyNeonMat && !this.hasTriggeredCorridorRedEyes) {
        const pulse = Math.sin(elapsed * 3.2) * 0.08 + Math.cos(elapsed * 14.5) * 0.03;
        this.lobbyNeonLight.intensity = 0.92 + pulse;
        this.lobbyNeonMat.emissiveIntensity = 0.2 + pulse * 0.35;
      }

      // 2. Partikel Kilau Kunci Ruang Panel 3B
      if (this.stairwellKeyMesh && !this.hasMaintenanceKey) {
        this.stairwellKeyMesh.rotation.y = -0.55 + Math.sin(elapsed * 2.0) * 0.1;
        if (this.keyGlintMat) {
          const baseOp = this.game.flashlightOn ? 0.95 : 0.42;
          this.keyGlintMat.opacity = baseOp * (0.65 + 0.35 * Math.sin(elapsed * 6.5));
          this.keyGlintMat.size = this.game.flashlightOn ? 0.045 : 0.026;
        }
      }

      // 3. Animasi Lerp Gorden Jendela Lobi (0.8 detik)
      if (this.isCurtainAnimating && this.curtainLeft && this.curtainRight) {
        const progress = Math.min(
          1,
          (performance.now() - this.curtainAnimStart) / (this.curtainAnimDuration * 1000)
        );
        const eased = 1 - Math.pow(1 - progress, 3);

        this.curtainLeft.position.x = 6.22 + (4.85 - 6.22) * eased;
        this.curtainLeft.scale.x = 1.0 - 0.78 * eased;

        this.curtainRight.position.x = 9.58 + (10.95 - 9.58) * eased;
        this.curtainRight.scale.x = 1.0 - 0.78 * eased;

        if (progress >= 1) {
          this.isCurtainAnimating = false;
          this.areCurtainsOpen = true;
        }
      }

      // 4. Kilatan Petir Redup di Kejauhan Luar Jendela
      if (this.skyFlashLight) {
        this.skyFlashTimer += delta;
        if (this.skyFlashTimer >= this.nextSkyFlashIn) {
          this.skyFlashTimer = 0;
          this.nextSkyFlashIn = 4.5 + Math.random() * 6.5;
          this.skyFlashLight.intensity = 1.45 + Math.random() * 0.75;
        } else {
          this.skyFlashLight.intensity += (0.14 - this.skyFlashLight.intensity) * Math.min(1, delta * 5.0);
        }
      }

      // 4B. Sembunyikan gedung skyline luar jendela saat pemain berada di dalam Ruang Panel 3B / Basement
      if (this.skylineGroup && camPos) {
        this.skylineGroup.visible = (camPos.z > -18.5 && camPos.y > -0.15);
      }

      // 5. Tombol Lift menyala kuning kehijauan (0xc8ff33) dan berdengung pelan saat daya aktif
      if (this.elevatorErrorLight && this.elevatorButtonMat) {
        if (this.isElevatorPowered) {
          const humPulse = 1.25 + Math.sin(elapsed * 6.0) * 0.15;
          this.elevatorErrorLight.color.setHex(0xc8ff33);
          this.elevatorErrorLight.intensity = humPulse;
          this.elevatorButtonMat.color.setHex(0xc8ff33);
        } else {
          const blink = Math.sin(elapsed * 8.5) > 0;
          this.elevatorErrorLight.intensity = blink ? 0.55 : 0.06;
          this.elevatorButtonMat.color.setHex(blink ? 0xff1a1a : 0x3a0505);
        }
      }

      // 5A. Animasi Pintu Kabin Lift Utama (0 = tertutup, 1.0 = terbuka penuh, 0.5 = terbuka paksa 50% di Lantai 2)
      if (this.mainElevatorLeftDoor && this.mainElevatorRightDoor) {
        this.elevatorDoorOpenFactor += (this.targetElevatorDoorFactor - this.elevatorDoorOpenFactor) * Math.min(1, delta * 4.5);
        const slideOffset = this.elevatorDoorOpenFactor * 0.62;
        this.mainElevatorLeftDoor.position.x = -0.32 - slideOffset;
        this.mainElevatorRightDoor.position.x = 0.32 + slideOffset;
      }

      // Getaran halus selama kabin lift bergerak turun menuju lantai dasar
      if (this.isElevatorDescending && this.game.camera) {
        this.game.camera.position.x = 7.9 + Math.sin(elapsed * 36.0) * 0.006;
        this.game.camera.position.y = 1.68 + Math.cos(elapsed * 42.0) * 0.008;
      }

      // 5B-2. Update Lingkungan, Audio Air, Rintangan Listrik, & Pengejaran Lantai 2 (The Flooded Ward)
      if (this.isOnFloorTwo && this.floorTwoGroup && this.floorTwoGroup.visible && camPos) {
        // Riak halus genangan air setinggi mata kaki
        if (this.floorTwoWaterMesh) {
          this.floorTwoWaterMesh.position.y = 0.078 + Math.sin(elapsed * 2.4) * 0.005;
        }

        // Kedipan & dengung halus Penunjuk Arah Darurat Hijau (Emergency Exit Signs #22c55e, intensitas 1.2)
        (this.floorTwoExitSignLights || this.floor2ExitSignLights || []).forEach((item) => {
          const flk = Math.sin(elapsed * 9.0 + item.phase) * Math.cos(elapsed * 19.0 + item.phase);
          const intensity = flk < -0.72 ? 0.45 : 1.2;
          item.light.intensity = intensity;
          item.mat.emissiveIntensity = intensity * 0.9;
        });

        // Trigger Sekuens Merayap Keluar Lift (Crawl Escape) saat keluar melewati celah pintu lift (z <= -10.0)
        if (!this.hasTriggeredFloor2EnterMonologue && camPos.z <= -10.0) {
          this._triggerFloor2CrawlExitSequence();
        }

        // SFX Langkah Kaki Deburan Air Basah (sfx_water_footsteps.mp3) saat bergerak di genangan Lantai 2
        const isMoving = Boolean(
          this.game.moveInput &&
          (this.game.moveInput.forward || this.game.moveInput.backward || this.game.moveInput.left || this.game.moveInput.right)
        );
        if (isMoving && camPos.z < -9.7 && !this.isFloor2StairDoorSlammedSafe && !this.isOnFloorOne && !this.isCutsceneLocked) {
          this.waterStepTimer += delta;
          const stepInterval = this.game.isSprinting ? 0.34 : (this.game.isCrouching ? 0.78 : 0.56);
          if (this.waterStepTimer >= stepInterval) {
            this.waterStepTimer = 0;
            this.game.playOneShotSfx('assets/audio/sfx_water_footsteps.mp3');
          }
        } else {
          this.waterStepTimer = 0.25;
        }

        // Bahaya Air Berlistrik (Electrified Water Hazard) di Koridor Timur (x = 18.6, z = -17.5)
        if (this.isFloor2BreakerOn) {
          // Kedipan percikan api listrik biru-putih
          if (this.electricSparkLight && this.electricArcMat) {
            const spk = Math.random() > 0.25 ? (1.8 + Math.random() * 1.8) : 0.25;
            this.electricSparkLight.intensity = spk;
            this.electricArcMat.opacity = Math.min(0.95, spk * 0.35);
          }

          // Looping SFX percikan listrik (sfx_electric_spark_loop.mp3) saat berada dalam jarak dengar (<= 11m)
          const distToCable = Math.hypot(camPos.x - 18.6, camPos.z - (-17.5));
          if (distToCable <= 11.5) {
            this.sparkAudioLoopTimer += delta;
            if (this.sparkAudioLoopTimer >= 3.05) {
              this.sparkAudioLoopTimer = 0;
              this.game.playOneShotSfx('assets/audio/sfx_electric_spark_loop.mp3');
            }
          }

          // Peringatan jarak 3 meter dari zona air berlistrik (maya_spark_warning.mp3 — 12000ms)
          if (
            !this.hasPlayedSparkWarningMonologue &&
            !this.game.isMayaSpeaking &&
            distToCable <= 4.6 &&
            camPos.x >= 15.8
          ) {
            this.hasPlayedSparkWarningMonologue = true;
            this.isActionBusy = true;
            this.game.playOneShotSfx('assets/audio/sfx_electric_spark_loop.mp3');
            this.game.setObjective('Temukan kotak sekring untuk memutus aliran listrik di genangan air.');
            this._playExactTimedMonologue(
              'assets/audio/maya_spark_warning.mp3',
              12000,
              'MAYA',
              'Kabel bertegangan menyentuh genangan air! Kalau aku melangkah ke sana, aku mati. Kotak sekringnya pasti ada di salah satu kamar ini.'
            );
          }

          // Box3 Trigger Zone: Jika melangkah masuk ke air berlistrik saat sekring masih menyala -> Game Over instan!
          if (this.electrifiedWaterBox3 && this.electrifiedWaterBox3.containsPoint(camPos)) {
            this._triggerElectrocutionGameOver();
          }
        }

        // Animasi Saklar Kotak Sekring Kamar 203 Turun
        if (this.isBreakerLeverAnimating && this.floor2BreakerLeverPivot) {
          const bt = Math.min(1, (performance.now() - this.breakerLeverAnimStart) / 420);
          this.floor2BreakerLeverPivot.rotation.z = -0.45 + bt * 0.95;
          if (bt >= 1) {
            this.isBreakerLeverAnimating = false;
          }
        }

        // Animasi Rantai & Gembok Jatuh ke Air saat Kode 7-4-2 Terbuka
        if (this.isChainsFalling) {
          this.chainsFallTimer += delta;
          const dropY = Math.max(0.08, 1.10 - this.chainsFallTimer * this.chainsFallTimer * 4.5);
          if (this.floor2ChainsGroup) this.floor2ChainsGroup.position.y = dropY;
          if (this.padlockMesh) this.padlockMesh.position.y = dropY;
          if (dropY <= 0.085) {
            this.isChainsFalling = false;
          }
        }

        // Animasi Pintu Tangga Darurat Lantai 2 Membuka
        if (this.isFloor2StairDoorAnimating && this.floor2StairDoorPivot) {
          const st = Math.min(1, (performance.now() - this.floor2StairDoorAnimStart) / 900);
          this.floor2StairDoorPivot.rotation.y = st * (Math.PI * 0.48);
          if (st >= 1) {
            this.isFloor2StairDoorAnimating = false;
          }
        }

        // Sekuens Pengejaran Air (Water Dash Scare): Entitas mengejar dari belakang menuju pintu tangga darurat!
        if (this.isFloor2WaterChaseActive && this.floor2ChaseEntity && this.floor2ChaseEntity.visible) {
          updateShadowEntityVertices(this.floor2ChaseEntity, elapsed);
          this.floor2ChaseEntity.lookAt(camPos.x, 0, camPos.z);
          this.floor2ChaseEntity.position.x = Math.max(4.35, this.floor2ChaseEntity.position.x - delta * 3.2);
        }

        // Begitu pemain melangkah masuk ke bordes tangga darurat (x <= 3.72), banting pintu besi menutup rapat!
        if (
          this.isFloor2StairDoorOpen &&
          !this.isFloor2StairDoorSlammedSafe &&
          camPos.x <= 3.72 &&
          camPos.z >= -12.4 &&
          camPos.z <= -9.8
        ) {
          this._slamFloor2EmergencyStairDoorSafe();
        }

        // Deteksi jarak dekat Pintu Darurat "Lantai 1 - Area Staf" di ujung bawah tangga (z = +1.5)
        // agar tombol [E] selalu responsif saat pemain tiba di bordes bawah tangga!
        if (
          !this.isFloor1EntryDoorOpen &&
          !this.isFloor1EntryDoorAnimating &&
          camPos.x >= 0.8 &&
          camPos.x <= 3.0 &&
          camPos.z >= -0.5 &&
          camPos.z <= 1.5 &&
          !this.game.isMayaSpeaking &&
          !this.isRadioTransmitting &&
          !this.game.currentHoveredTarget
        ) {
          this.game.currentHoveredTarget = 'floor1_stair_exit_door';
          this.game._setInteractionPrompt('[E] Buka Pintu Darurat (Lantai 1 - Area Staf)');
        }

        // Animasi Pintu Darurat "Lantai 1 - Area Staf" Membuka (z = +1.5)
        if (this.isFloor1EntryDoorAnimating && this.floor1StairExitDoorPivot) {
          const dt = Math.min(1, (performance.now() - this.floor1EntryDoorAnimStart) / 950);
          const eased = 1 - Math.pow(1 - dt, 3);
          this.floor1StairExitDoorPivot.rotation.y = -eased * (Math.PI * 0.48);
          if (dt >= 1) {
            this.isFloor1EntryDoorAnimating = false;
          }
        }

        // Kedipan Halus Lampu Neon Remang di Koridor Staf Lantai 1
        if (Array.isArray(this.floor1StaffNeonLights)) {
          this.floor1StaffNeonLights.forEach((item) => {
            const wave = Math.sin(elapsed * 6.5 + item.phase) * Math.cos(elapsed * 17.0 + item.phase);
            const inten = wave < -0.78 ? 0.28 : 0.68;
            if (item.light) item.light.intensity = inten;
            if (item.mat) item.mat.emissiveIntensity = inten * 0.82;
          });
        }

        // Logika Radio HT di Atas Meja Keamanan Lantai 1 (x = 1.08, y = -3.41, z = +7.8)
        if (this.radioHTMesh && !this.hasPickedUpRadioHT) {
          const distToRadioDesk = Math.hypot(camPos.x - 1.08, camPos.z - 7.8);

          // Proximity Trigger 2.5 meter: Radio mulai berderau memanggil (sfx_radio_static_call.mp3)
          if (!this.hasTriggeredRadioStaticCall && camPos.y < -2.2 && distToRadioDesk <= 2.5) {
            this.hasTriggeredRadioStaticCall = true;
            this.isRadioRinging = true;
            this.game.playOneShotSfx('assets/audio/sfx_radio_static_call.mp3');
            this.game.setObjective('Ambil Radio HT di atas meja keamanan [E].');
          }

          // Tampilkan prompt "[E] Ambil Radio HT" saat pemain berada dalam radius 2.5m dari meja keamanan
          if (
            this.isRadioRinging &&
            distToRadioDesk <= 2.5 &&
            !this.game.isMayaSpeaking &&
            !this.isRadioTransmitting &&
            !this.game.currentHoveredTarget
          ) {
            this.game.currentHoveredTarget = 'radio_ht';
            this.game._setInteractionPrompt('[E] Ambil Radio HT');
          }

          // Animasi Lampu LED Indikator Radio HT:
          // - Sebelum didekati: berkedip hijau pelan (0x22c55e)
          // - Saat memanggil (radius <= 2.5m): berkedip cepat bergantian hijau-merah (0x22c55e <-> 0xff1a1a)
          if (this.radioLEDMat && this.radioLEDLight) {
            if (this.isRadioRinging) {
              const fastToggle = Math.floor(elapsed * 10.0) % 2 === 0;
              const col = fastToggle ? 0x22c55e : 0xff1a1a;
              this.radioLEDMat.color.setHex(col);
              this.radioLEDLight.color.setHex(col);
              this.radioLEDLight.intensity = 1.65;
            } else {
              const slowPulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(elapsed * 2.6));
              this.radioLEDMat.color.setHex(0x22c55e);
              this.radioLEDLight.color.setHex(0x22c55e);
              this.radioLEDLight.intensity = slowPulse * 1.15;
            }
          }
        }

        // Animasi Pembukaan Pintu Double-Door di Ujung Koridor Staf Lantai 1 setelah Dialog Dhafir Selesai
        if (this.isFloor1DoubleDoorAnimating) {
          const ddt = Math.min(1, (performance.now() - this.floor1DoubleDoorAnimStart) / 1100);
          const eased = 1 - Math.pow(1 - ddt, 3);
          if (this.floor1DoubleDoorLeftPivot) {
            this.floor1DoubleDoorLeftPivot.rotation.y = -eased * (Math.PI * 0.46);
          }
          if (this.floor1DoubleDoorRightPivot) {
            this.floor1DoubleDoorRightPivot.rotation.y = eased * (Math.PI * 0.46);
          }
          if (ddt >= 1) {
            this.isFloor1DoubleDoorAnimating = false;
          }
        }

        // Pemicu Jebakan Ruang Arsip (Panic Archive Room):
        // Begitu seluruh badan pemain melangkah masuk melewati ambang pintu (z >= 18.35):
        if (
          this.isFloor1DoubleDoorUnlocked &&
          !this.hasTriggeredArchiveTrap &&
          camPos.y < -2.0 &&
          camPos.x >= -0.8 &&
          camPos.x <= 4.6 &&
          camPos.z >= 18.35
        ) {
          this._triggerPanicArchiveTrap();
        }

        // Animasi Pintu Hidrolik Terbanting Menutup Otomatis (0.22 detik)
        if (this.isArchiveDoorSlamAnimating) {
          const st = Math.min(1, (performance.now() - this.archiveDoorSlamStart) / 220);
          const rem = 1 - st;
          if (this.floor1DoubleDoorLeftPivot) {
            this.floor1DoubleDoorLeftPivot.rotation.y = -rem * (Math.PI * 0.46);
          }
          if (this.floor1DoubleDoorRightPivot) {
            this.floor1DoubleDoorRightPivot.rotation.y = rem * (Math.PI * 0.46);
          }
          if (st >= 1) {
            this.isArchiveDoorSlamAnimating = false;
          }
        }

        // Kedipan Konslet Panel Kunci Elektronik Ruang Arsip
        if (this.archiveElectronicSparkLight && this.archiveElectronicPanelMat) {
          const spk = Math.random() > 0.86 ? 1.6 : 0.35;
          this.archiveElectronicSparkLight.intensity = spk;
          this.archiveElectronicPanelMat.color.setHex(spk > 1.0 ? 0xffaa44 : 0x991b1b);
        }

        // Animasi Pintu Hidrolik Tumbang ke Depan & Partikel Asap/Api saat Ditembak Dhafir (Babak 7)
        if (this.isArchiveBreachAnimating && this.archiveExitDoorPivot) {
          const bt = Math.min(1, (performance.now() - this.archiveBreachAnimStart) / 680);
          const eased = bt * bt;
          // Pintu tumbang ke depan (menuju koridor lobi z > 24.5)
          this.archiveExitDoorPivot.rotation.x = eased * (Math.PI * 0.48);
          this.archiveExitDoorPivot.position.y = -4.2 - eased * 0.04;
          if (this.archiveHingeSparksMat) {
            this.archiveHingeSparksMat.opacity = Math.max(0, 1 - bt * 1.2);
          }
          if (this.archiveBreachFlashLight) {
            this.archiveBreachFlashLight.intensity = Math.max(0, (1 - bt) * 4.2);
          }
          if (bt >= 1) {
            this.isArchiveBreachAnimating = false;
          }
        }

        if (this.archiveHingeSmokeGroup && this.archiveHingeSmokeGroup.visible) {
          this.archiveHingeSmokeGroup.children.forEach((puff, idx) => {
            puff.position.y += delta * (0.18 + idx * 0.03);
            if (puff.position.y > 1.2) puff.position.y = -0.3;
          });
        }
      }

      // 5B. Update Layar Monitor Tabung CCTV & Kamera Lerp saat Inspeksi CCTV
      this._updateCctvMonitorCanvas(elapsed);
      if (this.isCctvInspecting && this.game.camera) {
        this.cctvInspectTimer += delta;
        // Lerp kamera fokus menatap layar monitor utama (x = 1.25, y = 1.12, z = -20.95)
        this.game.camera.position.x += (1.25 - this.game.camera.position.x) * Math.min(1, delta * 6.0);
        this.game.camera.position.y += (1.18 - this.game.camera.position.y) * Math.min(1, delta * 6.0);
        this.game.camera.position.z += (-20.25 - this.game.camera.position.z) * Math.min(1, delta * 6.0);
        this.game.yaw += (0 - this.game.yaw) * Math.min(1, delta * 6.0);
        this.game.pitch += (-0.08 - this.game.pitch) * Math.min(1, delta * 6.0);
        this.game.camera.rotation.y = this.game.yaw;
        this.game.camera.rotation.x = this.game.pitch;
      }

      // 5C. Animasi Rotasi Tuas Generator Turun 45 Derajat (Math.PI / 4) & Getaran Mesin
      if (this.isLeverAnimating && this.generatorLeverPivot) {
        const lt = Math.min(1, (performance.now() - this.leverAnimStart) / 480);
        this.generatorLeverPivot.rotation.x = -0.35 + lt * (Math.PI / 4 + 0.35);
        if (lt >= 1) {
          this.isLeverAnimating = false;
        }
      }
      if (this.isGeneratorRunning && this.generatorGroup) {
        this.generatorGroup.position.x = 3.9 + Math.sin(elapsed * 48.0) * 0.008;
        this.generatorGroup.position.y = -4.4 + Math.cos(elapsed * 54.0) * 0.006;
      }

      // 5D. Animasi Jumpscare Lari Cepat (Dash / Flicker Encounter) di Basement (0.5 detik)
      if (this.isBasementDashAnimating && this.basementDashEntity) {
        updateShadowEntityVertices(this.basementDashEntity, elapsed);
        const dt = Math.min(1, (performance.now() - this.basementDashStart) / 500);
        // Melesat sangat kencang melintasi celah antara dua pilar beton (-0.8 ke +8.2)
        this.basementDashEntity.position.x = -0.8 + dt * 9.0;
        this.basementDashEntity.position.y = -4.4 + Math.abs(Math.sin(dt * Math.PI * 6)) * 0.12;
        if (dt >= 1) {
          this.isBasementDashAnimating = false;
          this.basementDashEntity.visible = false;
        }
      }

      // 6. Animasi Pintu Kamar 304 Membuka Lebih Lebar
      if (this.isRoom304Animating && this.room304DoorPivot) {
        const t = Math.min(1, (performance.now() - this.room304AnimStart) / (this.room304AnimDuration * 1000));
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        this.room304DoorPivot.rotation.y = 0.62 + eased * (Math.PI / 2 - 0.62);
        if (t >= 1) {
          this.isRoom304Animating = false;
          this.room304TargetAngle = Math.PI / 2;
        }
      }

      // 7. Animasi Pintu Maintenance 3B Membuka 90 Derajat ke Dalam
      if (this.isMaintenance3BAnimating && this.maintenance3BDoorPivot) {
        const t = Math.min(1, (performance.now() - this.maintenance3BAnimStart) / 1400);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        this.maintenance3BDoorPivot.rotation.y = eased * (Math.PI / 2);
        if (t >= 1) {
          this.isMaintenance3BAnimating = false;
          this.isMaintenance3BOpen = true;
        }
      }

      // 8. Getaran Daun Pintu Kamar 307 saat Benturan Berat
      if (this.room307ThudTimer > 0 && this.room307DoorGroup) {
        this.room307ThudTimer -= delta;
        this.room307DoorGroup.position.z = -14.91 + Math.sin(elapsed * 55) * 0.025;
        if (this.room307ThudTimer <= 0) {
          this.room307DoorGroup.position.z = -14.91;
        }
      }

      // 9. Cek Pandangan Pemain & Vertex Animation Entitas
      this._updateEntityGazeCheck(delta, elapsed);

      if (!camPos) return;

      // 10. Trigger Masuk Kamar 304
      if (
        !this.hasEnteredRoom304 &&
        camPos.x >= 13.5 &&
        camPos.x <= 16.2 &&
        camPos.z <= -15.22
      ) {
        this._triggerRoom304EnterSequence();
      }

      // 10B. Trigger Masuk Ruang Panel 3B (Maintenance & Security Room)
      if (
        this.isMaintenance3BOpen &&
        !this.hasEnteredMaintenance3B &&
        camPos.x >= 0.0 &&
        camPos.x <= 5.8 &&
        camPos.z <= -17.85
      ) {
        this._triggerEnterMaintenance3B();
      }

      // 10C. Atmosfer Tetesan Air Bergaung di Tangga & Basement (z < -23.0)
      if (camPos.z < -23.0) {
        this.dripTimer += delta;
        if (this.dripTimer > 3.2 + Math.random() * 2.5) {
          this.dripTimer = 0;
          this.game._playProceduralClickSfx(980 + Math.random() * 240);
        }
      }

      // 10E. Munculkan Entitas Pengintai (Stalker Entity) untuk Mekanik Tatapan Fatal saat kembali ke atas setelah generator nyala
      if (
        this.isGeneratorRunning &&
        !this.isElevatorCabinOpen &&
        !this.isOnFloorTwo &&
        this.stalkerShadowEntity
      ) {
        if (camPos.z > -32.0 && camPos.z < -17.6) {
          // Saat pemain menaiki tangga kembali ke Ruang Panel 3B, entitas mengintai di sudut ruangan
          this.stalkerShadowEntity.position.set(1.1, 0, -19.0);
          this.stalkerShadowEntity.visible = true;
          this.isStalkerEntityActive = true;
        } else if (camPos.z >= -17.6 && camPos.z < -10.2) {
          // Saat pemain keluar ke lobi lantai 3 menuju lift, entitas berdiri di sisi lobi
          this.stalkerShadowEntity.position.set(3.8, 0, -13.4);
          this.stalkerShadowEntity.visible = true;
          this.isStalkerEntityActive = true;
        }
      }

      // 10D. Trigger Jumpscare Lari Cepat (Dash / Flicker Encounter) saat jarak <= 4m dari Generator Basement
      if (
        !this.hasTriggeredBasementDash &&
        camPos.z < -37.0 &&
        Math.hypot(camPos.x - 3.9, camPos.z - (-44.2)) <= 4.3
      ) {
        this.hasTriggeredBasementDash = true;
        this.isBasementDashAnimating = true;
        this.basementDashStart = performance.now();
        if (this.basementDashEntity) {
          this.basementDashEntity.position.set(-0.8, -4.4, -41.3);
          this.basementDashEntity.rotation.y = Math.PI / 2;
          this.basementDashEntity.visible = true;
        }
        // Putar audio SFX hembusan kencang dan jeritan distorsi tajam: sfx_creature_dash.mp3
        this.game.playOneShotSfx('assets/audio/sfx_creature_dash.mp3');
        // Camera shake tajam sesaat (0.45 detik)
        this.game.cameraShakeDuration = 0.45;
        this.game.cameraShakeTimer = 0;
        this.game.cameraShakeIntensity = 0.065;
      }

      // 11. Trigger Kemunculan Mata Merah di Koridor Luar saat Maya melangkah keluar dari Kamar 304
      if (
        this.hasMaintenanceKey &&
        !this.isRoom304TrapLocked &&
        !this.hasTriggeredCorridorRedEyes &&
        camPos.z >= -14.85
      ) {
        this._triggerCorridorRedEyesEvent();
      }

      // 12. Event 1 Environmental Screamer: Lift Drop Shudder
      if (
        !this.hasTriggeredElevatorDrop &&
        camPos.x >= 4.2 &&
        camPos.x <= 8.6 &&
        camPos.z >= -14.2 &&
        camPos.z <= -9.6
      ) {
        this.hasTriggeredElevatorDrop = true;
        this.game.cameraShakeDuration = 0.5;
        this.game.cameraShakeTimer = 0;
        this.game.cameraShakeIntensity = 0.062;
        this.game.playOneShotSfx('assets/audio/sfx_elevator_drop.mp3');
      }

      // 13. Event 2 Environmental Screamer: Pot Bunga / Vas Jatuh Pecah
      if (
        !this.hasTriggeredVaseDrop &&
        camPos.x >= 16.0 &&
        camPos.z >= -15.0 &&
        camPos.z <= -11.8
      ) {
        this.hasTriggeredVaseDrop = true;
        this.isVaseFalling = true;
        this.vaseFallStart = performance.now();
      }

      if (this.isVaseFalling && this.vaseMesh) {
        const ft = Math.min(1, (performance.now() - this.vaseFallStart) / (this.vaseFallDuration * 1000));
        this.vaseMesh.position.y = 0.90 - (ft * ft) * 0.86;
        this.vaseMesh.position.z = -12.52 - ft * 0.40;
        this.vaseMesh.rotation.x = ft * Math.PI * 2.4;
        this.vaseMesh.rotation.z = ft * 1.8;

        if (ft >= 1) {
          this.isVaseFalling = false;
          this.vaseMesh.visible = false;
          if (this.vaseShardsGroup) {
            this.vaseShardsGroup.visible = true;
          }
          this.game.playOneShotSfx('assets/audio/sfx_vase_break.mp3');
        }
      }
    }
  }

  window.Blindspot.createShadowRedEyesEntity = createShadowRedEyesEntity;
  window.Blindspot.updateShadowEntityVertices = updateShadowEntityVertices;
  window.Blindspot.FloorThreeExpansion = FloorThreeExpansion;
})(window);

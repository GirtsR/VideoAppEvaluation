## Risinājums video kvalitātes novērtēšanai reāllaika komunikāciju programmatūras testēšanā

### Atkarības:

- [Node.js](https://nodejs.org/en/download/) JavaScript programmēšanas valodas izpildlaika vide
- [npm](https://www.npmjs.com/) pakotņu pārvaldnieks
- [ffmpeg](https://ffmpeg.org/) bibliotēka
- [ffmpeg-quality-metrics](https://github.com/slhck/ffmpeg-quality-metrics) Python pakotne

### Risinājuma daļas:

- Testa video izveides modulis: [create-test-video.js](helpers/create-test-video.js)
- Ierakstīšanas modulis: [record-video.js](src/record-video.js)
- Īsināšanas modulis: [trim-video.js](src/trim-video.js)
- Kadrēšanas biežuma noteikšanas modulis: [calculate-fps.js](src/calculate-fps.js)
- Izgriešanas modulis: [crop-video.js](src/crop-video.js)
- Kvalitātes novērtēšanas modulis: [calculate-quality-scores.js](src/calculate-quality-scores.js)

### Risinājuma palaišanas piemērs

Testa video ģenerēšana:
```shell
node helpers/create-test-video.js -f <ceļs_uz_oriģinālo_video_failu>
```

Risinājuma palaišana (ieraksts uz macOS ierīces):
```shell
node index.js -d <ceļš_uz_rezultātu_folderi> -r <ceļš_uz_atsauces_video> -t <testa_nosaukums> -i <ekrāna_indekss>
```

Risinājuma palaišana (ieraksts uz Android ierīces):
```shell
node index.js -d <ceļš_uz_rezultātu_folderi> -r <ceļš_uz_atsauces_video> -t <testa_nosaukums> -p
```

Papildinformācija par komandrindas argumentiem:
```shell
node index.js -h
```

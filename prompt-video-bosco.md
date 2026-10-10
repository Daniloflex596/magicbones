# Prompt per rifare il film d'apertura (il cammino nel bosco fino alla casetta)

Il film si muove mentre si scorre la pagina (avanti e indietro), quindi deve
essere **un'unica ripresa continua, a velocità costante, senza tagli**.
Servono due versioni girate nativamente: **16:9** (computer) e **9:16** (telefono).

**Lo stile di riferimento** è l'immagine verticale del sentiero che Danilo ha
scelto (alberi d'edera ad arco, raggi dorati, sentiero a gradini di radici,
casetta a metà distanza, teschio e candele a sinistra, corna con pendente
triquetra a destra). Allegala SEMPRE come riferimento.

Ordine di lavoro:
1. PARTENZA 9:16 = l'immagine di riferimento (ce l'hai già).
2. PARTENZA 16:9 → dalla 9:16, prompt A.
3. ARRIVO 9:16 e ARRIVO 16:9 → prompt B (allega la partenza dello stesso formato).
4. Video con Veo (Google Flow → "Frames to Video": prima = partenza, ultima =
   arrivo), una volta in 9:16 e una in 16:9, prompt C. Fanne 3-4 varianti e
   tieni la più fluida (velocità costante, niente oggetti che si deformano).
5. Mandami i due .mp4: li ricodifico per lo scorrimento, rifaccio le immagini
   ferme (inizio/fine) e aggiorno la durata in `site/js/config.js`.

**Blocco STILE** (è già dentro ogni prompt qui sotto):
> Hyper-detailed enchanted fantasy forest in a photoreal digital-painting style: rich saturated warm colours, glowing honey-gold sunlight with strong volumetric god rays and golden haze, deep moss and ivy greens, warm bark browns, touches of lavender purple and fly-agaric red, crisp fine detail everywhere, cosy and magical, never dark or scary.

---

## A · PARTENZA 16:9 (allega la partenza 9:16)

```
Recompose the reference image as a wide 16:9 landscape, same scene, same style, same light. Hyper-detailed enchanted fantasy forest in a photoreal digital-painting style: rich saturated warm colours, glowing honey-gold sunlight with strong volumetric god rays and golden haze, deep moss and ivy greens, warm bark browns, touches of lavender purple and fly-agaric red, crisp fine detail everywhere, cosy and magical. Eye-level view at the start of a dirt path with exposed tree roots forming natural steps, leading straight ahead in the center of the frame. Huge ivy-covered oak trunks on both sides arch overhead like a natural gateway. In the middle distance at the end of the path, a small storybook cottage: thick moss roof, stone chimney with white smoke, bleached deer skull with antlers above the arched wooden door, glowing round window, lanterns, candlelit tables beside the door. Left foreground: a mossy wooden stump-table with a bleached deer skull, two lit candles, quartz crystals, an amethyst and a small potion bottle. Right foreground: a shed antler on a mossy boulder with a golden triquetra pendant hanging from it, red fly agaric mushrooms with small lit candles. Ferns, white daisies, lavender and moss-covered stones along the path. No people, no animals, no text, no watermark.
```

## B · ARRIVO (stesso prompt per 9:16 e 16:9 — allega la partenza dello stesso formato)

```
Same enchanted forest, same style and same golden light as the reference image, in the same aspect ratio. The viewer has walked up the whole path and now stands a few steps from the cottage, at eye level, looking straight at the front door. Hyper-detailed enchanted fantasy forest in a photoreal digital-painting style: rich saturated warm colours, glowing honey-gold sunlight with volumetric god rays and golden haze, deep moss and ivy greens, warm bark browns, touches of lavender purple and fly-agaric red, crisp fine detail, cosy and magical. The cottage fills the center of the frame: old timber and stone walls, steep roof covered in thick moss and ivy, stone chimney with white smoke curling up, a bleached deer skull with antlers mounted above the arched wooden door with iron hinges, warm amber light glowing from the round window and from two lanterns beside the door. On both sides of the door, rustic wooden tables with lit candles, dried herbs, crystals, small skulls and potion bottles. The root steps of the path end at two worn stone steps; red fly agaric mushrooms, lit candles, ferns and daisies in the mossy foreground. Ivy-covered trunks frame the sides, sunbeams falling from the upper left. No people, no animals, no text, no watermark.
```

## C · VIDEO — Veo "Frames to Video" (prima = partenza, ultima = arrivo)

Uguale per 9:16 e 16:9 (cambia solo il formato scelto in Flow):

```
One single continuous shot, no cuts: a slow walk up the path that arrives at the cottage and stops. From the very first frame the camera dollies forward up the root-stepped dirt path at a calm, steady walking pace, perfectly smooth and at the same constant speed, passing between the ivy-covered trunks and getting closer and closer to the cottage. In the last second it eases gently to a complete stop a few steps from the front door, with the door centered, exactly matching the end frame, and then holds perfectly still until the end. The camera stays at eye level and always looks straight ahead: no turning, no zoom, no tilt, no shake, no sudden speed changes, it never stops halfway and never goes past the door. Only subtle natural motion: golden sunbeams shimmering, dust motes floating in the light, leaves swaying gently, candle flames flickering softly, white smoke rising from the chimney. Same hyper-detailed warm golden fantasy style for the whole shot; lighting, colours and every object stay consistent — nothing appears, disappears or changes shape. No people, no animals, no birds, no text.
```

**Come deve muoversi (perché):** il film avanza mentre si scorre la pagina.
Velocità costante vuol dire che a ogni tratto di scorrimento corrisponde lo
stesso tratto di sentiero, e le 4 tappe della storia cadono al punto giusto.
L'arrivo con fermata davanti alla porta è il punto da cui si passa alla
vetrina e poi alla casetta del catalogo.

Scarta il video se la camera:
- accelera, rallenta o si ferma a metà sentiero;
- non arriva davanti alla porta, o la supera, gira, sale o zooma;
- fa cambiare forma a funghi, candele, teschi o alla casetta.
Sono proprio i difetti che si notano scorrendo la pagina.

/** Original top-down vector airframes. Every frame has its own wing, tail and engine layout.
 * No bitmap background, filters or remote resources: the same art rasterizes cleanly at 96px or 640px. */
const frames = [
  {
    wing: "M190 156C159 148 96 147 39 171Q17 181 20 207Q26 224 57 226L185 246Z",
    tail: "M191 299L121 327Q109 335 119 351L192 348Z",
    body: "M200 35Q180 37 181 112L174 206 188 331Q200 365 212 331L226 206 219 112Q220 37 200 35Z",
    engines: [],
    prop: true,
  },
  {
    wing: "M187 148L151 197 83 160 23 180 22 213 91 243 150 224 188 251Z",
    tail: "M190 301L130 326 112 353 193 344Z",
    body: "M200 29Q179 36 179 111L181 240 190 338 200 365 210 338 219 240 221 111Q221 36 200 29Z",
    engines: [],
    prop: true,
  },
  {
    wing: "M191 142L29 153 18 181 28 208 185 224Z",
    tail: "M200 300L110 309 94 336 200 332Z",
    body: "M200 58Q179 58 179 135L182 253 200 285 218 253 221 135Q221 58 200 58Z",
    engines: [105, 295],
    prop: true,
    boom: true,
  },
  {
    wing: "M186 130L147 174 44 279 101 280 187 249Z",
    tail: "M190 285L152 327 148 349 193 328Z",
    body: "M200 24L181 113 177 222 187 317 200 345 213 317 223 222 219 113Z",
    engines: [185, 215],
    prop: false,
  },
  {
    wing: "M188 149Q127 146 47 180Q13 197 36 220Q75 249 189 238Z",
    tail: "M190 300Q145 309 133 333Q145 351 193 340Z",
    body: "M200 31Q180 39 181 111L176 218 192 346 200 364 208 346 224 218 219 111Q220 39 200 31Z",
    engines: [],
    prop: true,
  },
  {
    wing: "M190 157L39 143 18 167 20 215 184 246Z",
    tail: "M190 300L107 317 96 350 194 341Z",
    body: "M200 34Q175 38 172 111L176 231 185 327 200 354 215 327 224 231 228 111Q225 38 200 34Z",
    engines: [112, 288],
    prop: true,
  },
  {
    wing: "M190 98L136 155 22 270 102 258 171 275 193 238Z",
    tail: "M191 279L152 307 174 339 194 318Z",
    body: "M200 24L178 112 163 222 200 333 237 222 222 112Z",
    engines: [180, 220],
    prop: false,
  },
  {
    wing: "M188 164L36 159Q18 163 18 184L22 218 187 232Z",
    tail: "M191 292L116 299 110 332 193 329Z",
    body: "M200 37Q175 43 175 132L180 254 187 328 200 354 213 328 220 254 225 132Q225 43 200 37Z",
    engines: [137, 263],
    prop: false,
  },
  {
    wing: "M189 137L129 178 32 202 25 235 181 252Z",
    tail: "M190 294L136 329 139 351 193 336Z",
    body: "M200 22Q184 27 182 92L177 215 190 340 200 365 210 340 223 215 218 92Q216 27 200 22Z",
    engines: [],
    prop: true,
  },
  {
    wing: "M185 193L43 113 30 140 111 218 184 251Z",
    tail: "M188 283L139 299 115 330 194 327Z",
    body: "M200 24L180 98 174 228 186 322 200 348 214 322 226 228 220 98Z",
    engines: [177, 223],
    prop: false,
  },
  {
    wing: "M200 57L25 229 18 270 92 254 124 281 154 257 200 278Z",
    tail: "M200 250L165 292 178 306 200 286Z",
    body: "M200 46L174 141 164 219 200 275 236 219 226 141Z",
    engines: [155, 245],
    prop: false,
  },
  {
    wing: "M184 134L71 119 21 163 24 234 119 253 182 235Z",
    tail: "M186 285L101 303 90 338 192 328Z",
    body: "M200 22L173 104 170 227 185 330 200 355 215 330 230 227 227 104Z",
    engines: [90, 141, 259, 310],
    prop: false,
  },
  {
    wing: "M188 160L38 154Q23 157 23 172L26 203 187 229Z",
    tail: "M192 288L132 307Q122 315 126 337L193 329Z",
    body: "M200 30Q184 36 183 101L180 208 190 321 200 355 210 321 220 208 217 101Q216 36 200 30Z",
    engines: [],
    prop: true,
  },
];
const accent = [
  "#e6a65a",
  "#eb6654",
  "#f1c969",
  "#ffb165",
  "#eddba4",
  "#e99255",
  "#8ecfeb",
  "#e6ae50",
  "#f8dca3",
  "#cf9cf8",
  "#77ccd0",
  "#eeae5f",
  "#ffd348",
];
const mirror = (content: string) =>
  `${content}<g transform="translate(400 0) scale(-1 1)">${content}</g>`;
function missile(x: number, y: number) {
  return `<g transform="translate(${x} ${y})" stroke="#14232c" stroke-width="1.5"><path d="M0 0Q-5 6-5 15V41L-10 50-4 49 0 55 4 49 10 50 5 41V15Q5 6 0 0Z" fill="url(#steel)"/><path d="M-5 17H5M-5 36H5" stroke="#eab957" stroke-width="4"/></g>`;
}
export function detailedAircraft(color: string, id: number, size = 640) {
  const f = frames[id] || frames[0],
    a = accent[id] || accent[0];
  const wing = mirror(`<path d="${f.wing}"/>`),
    tail = mirror(`<path d="${f.tail}"/>`);
  const panels = Array.from({ length: 7 }, (_, r) =>
    Array.from({ length: 12 }, (_, c) => {
      const x = 20 + c * 30,
        y = 110 + r * 23;
      return `<rect x="${x}" y="${y}" width="29" height="22" rx="1" fill="${(r + c) % 3 === 0 ? "#ecf1dc13" : "#08121e09"}" stroke="#101e28" stroke-opacity=".48" stroke-width=".7"/><path d="M${x + 2} ${y + 3}h25" stroke="#e5f0d9" opacity=".2"/><g fill="#d9dbc1" opacity=".65"><circle cx="${x + 3}" cy="${y + 4}" r=".8"/><circle cx="${x + 26}" cy="${y + 18}" r=".8"/></g>`;
    }).join(""),
  ).join("");
  const engines = f.engines
    .map(
      (x) =>
        `<g transform="translate(${x} 0)"><path d="M-15 119Q0 96 15 119L19 219Q18 246 0 250Q-18 246-19 219Z" fill="url(#paint)" stroke="#101c27" stroke-width="3"/><path d="M-17 171H17M-18 202H18" stroke="#142532" stroke-width="4"/><path d="M-15 158H15M-15 194H15" stroke="#dde9d088"/><path d="M-18 210H18V222H-18Z" fill="${a}"/><ellipse cy="237" rx="16" ry="12" fill="#15232d" stroke="#b8beb0" stroke-width="3"/><ellipse cy="238" rx="10" ry="7" fill="url(#fire)"/>${f.prop ? '<path d="M-30 116Q0 109 30 116Q0 122-30 116Z" fill="#232e32" stroke="#a9b4a6"/>' : ""}</g>`,
    )
    .join("");
  const booms = f.boom
    ? mirror(
        '<path d="M101 207L98 313 81 333 105 348 121 331 113 207Z" fill="url(#paint)" stroke="#15212a" stroke-width="3"/>',
      )
    : "";
  const insignia =
    id === 12
      ? `<g transform="translate(63 187)"><rect x="-18" y="-12" width="36" height="24" rx="2" fill="#195d3b"/><path d="M-16 0L0-10 16 0 0 10Z" fill="#f5ca43"/><circle r="6" fill="#246a9e"/><path d="M-5-2L5 1" stroke="white" stroke-width="1.3"/></g>`
      : `<g transform="translate(65 196)"><circle r="13" fill="#1d3446" stroke="#ccd5bf" stroke-width="2"/><path d="M0-9L3-2 10-2 5 3 7 10 0 6-7 10-5 3-10-2-3-2Z" fill="#e3dfbf"/><path d="M-23-2H-15M15-2H23" stroke="#e3dfbf" stroke-width="4"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 400 400"><defs><linearGradient id="paint"><stop stop-color="#0c1825"/><stop offset=".18" stop-color="${color}"/><stop offset=".42" stop-color="#d1d9c1"/><stop offset=".51" stop-color="${color}"/><stop offset=".84" stop-color="${color}"/><stop offset="1" stop-color="#172936"/></linearGradient><linearGradient id="steel"><stop stop-color="#131e29"/><stop offset=".35" stop-color="#bfccd0"/><stop offset=".55" stop-color="#e4ebdd"/><stop offset="1" stop-color="#3b5262"/></linearGradient><linearGradient id="glass" x1="0" x2="1" y2=".25"><stop stop-color="#020c1b"/><stop offset=".4" stop-color="#135677"/><stop offset=".54" stop-color="#7fe9fa"/><stop offset=".62" stop-color="#176184"/><stop offset="1" stop-color="#030e1e"/></linearGradient><radialGradient id="fire"><stop stop-color="#fffbd0"/><stop offset=".45" stop-color="#ffc342"/><stop offset="1" stop-color="#ef641a"/></radialGradient><clipPath id="w"><path d="${f.wing}"/><path d="${f.wing}" transform="translate(400 0) scale(-1 1)"/><path d="${f.tail}"/><path d="${f.tail}" transform="translate(400 0) scale(-1 1)"/></clipPath><clipPath id="body"><path d="${f.body}"/></clipPath></defs><g stroke-linejoin="round"><g fill="url(#paint)" stroke="#0e1a25" stroke-width="5">${tail}${booms}${wing}</g><g clip-path="url(#w)">${panels}<path d="M20 166L177 183M223 183L380 166M120 316L188 312M212 312L280 316" stroke="#f0e7c0" stroke-width="2" opacity=".5"/><path d="M30 120L59 270M341 270L370 120" stroke="${a}" stroke-width="16"/><path d="M52 120L81 270M319 270L348 120" stroke="#1b2a35" stroke-width="7"/>${mirror(insignia)}</g>${mirror(missile(67, 222) + missile(91, 225))}${engines}<path d="${f.body}" fill="url(#paint)" stroke="#101c27" stroke-width="4"/><g clip-path="url(#body)"><path d="M185 60H215M177 101H223M176 243H224M183 283H217M188 316H212" stroke="#15242c" stroke-width="3"/><path d="M188 62L193 320M212 62L207 320" stroke="#e5ead1" opacity=".4"/><path d="M176 72H224V84H176M180 278H220V291H180" fill="${a}"/>${Array.from({ length: 16 }, (_, i) => `<circle cx="${i % 2 ? 214 : 186}" cy="${82 + Math.floor(i / 2) * 31}" r="1.2" fill="#dfdfbc"/>`).join("")}</g>${mirror('<path d="M164 126H176V180H162Z" fill="#15212a" stroke="#a6b2a3" stroke-width="2"/><path d="M164 133H173M164 142H173M164 151H173M164 160H173M164 169H173" stroke="#5b6b68" stroke-width="2"/>')}<path d="M200 101Q177 110 180 158L182 209Q188 230 200 233Q212 230 218 209L220 158Q223 110 200 101Z" fill="url(#steel)" stroke="#14212d" stroke-width="3"/><path d="M200 108Q184 120 186 155L188 205Q193 221 200 223Q207 221 212 205L214 155Q216 120 200 108Z" fill="url(#glass)" stroke="#102436" stroke-width="2"/><path d="M186 151Q200 145 214 151M187 183Q200 178 213 183M200 110V220" fill="none" stroke="#bcc8be" stroke-width="2"/><path d="M192 124Q187 133 190 143M192 157V174M193 191V202" stroke="#d8fbff" stroke-width="2" stroke-linecap="round" opacity=".8"/>${mirror('<g stroke="#142330" stroke-width="2"><path d="M137 151V111H145V167H137Z" fill="url(#steel)"/><path d="M149 161V121H155V174H149Z" fill="url(#steel)"/><path d="M137 138H145M149 148H155" stroke="#e6b052" stroke-width="4"/></g>')}<path d="M197 267L196 334 200 347 204 334 203 267Z" fill="${a}" stroke="#192935" stroke-width="2"/>${f.prop ? '<path d="M152 46Q170 38 200 44Q230 38 248 46Q227 55 200 49Q173 55 152 46Z" fill="#17262d" stroke="#c9ccb2" stroke-width="1.5"/><ellipse cx="200" cy="45" rx="8" ry="12" fill="url(#steel)"/>' : '<path d="M188 310L192 340 200 353 208 340 212 310Z" fill="#14212b"/><path d="M193 329L200 350 207 329Z" fill="url(#fire)"/>'}</g></svg>`;
}
export function companionArt(id: number) {
  const color = ["#e6ae48", "#80b4aa", "#a49cd1", "#679bb5"][id] || "#a4bca6";
  const shapes = [
    "M100 17L114 77 172 113 177 139 114 122 112 166 138 180 138 192 100 185 62 192 62 180 88 166 86 122 23 139 28 113 86 77Z",
    "M100 28L120 86 185 66 188 93 120 130 116 169 150 181 148 195 100 181 52 195 50 181 84 169 80 130 12 93 15 66 80 86Z",
    "M100 15L164 89 188 149 152 143 130 166 100 151 70 166 48 143 12 149 36 89Z",
    "M100 24L119 69 183 113 180 150 119 131 112 167 147 182 142 196 100 184 58 196 53 182 88 167 81 131 20 150 17 113 81 69Z",
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="210" viewBox="0 0 200 210"><defs><linearGradient id="p"><stop stop-color="#142c39"/><stop offset=".43" stop-color="${color}"/><stop offset=".5" stop-color="#d4dfcc"/><stop offset=".64" stop-color="${color}"/><stop offset="1" stop-color="#243c4c"/></linearGradient></defs><path d="${shapes[id]}" fill="url(#p)" stroke="#0b1a25" stroke-width="4"/><path d="M100 45Q84 66 91 111L109 111Q116 66 100 45Z" fill="#145879" stroke="#cae8d8" stroke-width="2"/><path d="M98 55V98" stroke="#8eeaf4" stroke-width="3"/><g fill="#19323e" stroke="#b6c7af"><rect x="48" y="100" width="13" height="49" rx="4"/><rect x="139" y="100" width="13" height="49" rx="4"/></g><path d="M55 115V76M145 115V76" stroke="#d9d5af" stroke-width="4"/><path d="M98 133V173M103 133V173M36 126L77 111M123 111L164 126" stroke="#e1c573" stroke-width="2"/>${Array.from({ length: 6 }, (_, i) => `<circle cx="${68 + i * 6}" cy="${122 - i * 3}" r="1" fill="#e3e7c7"/><circle cx="${132 - i * 6}" cy="${122 - i * 3}" r="1" fill="#e3e7c7"/>`).join("")}</svg>`;
}

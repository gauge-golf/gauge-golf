# Gauge Golf — Korean Localization (ko-KR)

> **Role:** Senior Korean Translator — premium magazine tone.
> **Goal:** Translate the entire site for a Korean audience in a clean, editorial voice
> (think *Vogue Korea / Toss / Sandoll Type Foundry* cadence — not literal, not Konglish-heavy).
> **For review by:** native Korean speaker (founder’s friend).
> Comments in `// italics` are translator notes — remove before going live.

---

## 0. Typography — recommended Korean stack

Currently the most trusted **premium Korean web typography** (2024–2026 market):

| Use | Font | Why |
| --- | --- | --- |
| **Primary UI / headlines / body** | **Pretendard** (weights 400 / 600 / 700 / 800 / 900) | The de-facto standard for premium Korean digital products (Toss, Daangn, Naver, Coupang). Matches the geometric feel of *Saira*. Free, SIL OFL. |
| **Editorial / poetic blocks** *(packaging, campaign posters, key taglines)* | **Sandoll Myungjo Neo** *(paid)* or **Noto Serif KR** *(free fallback)* | Korean luxury editorial standard — used by Vogue Korea, premium fashion. |
| **System fallback** | Apple SD Gothic Neo (iOS/macOS), Malgun Gothic (Windows) | Guaranteed native rendering. |

**Suggested CSS stack (replace `--font-display` when `lang="ko"`):**
```css
font-family:
  "Pretendard Variable", Pretendard,
  -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo",
  "Malgun Gothic", system-ui, sans-serif;
```
Load via CDN (one line, no NPM needed):
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
```

---

## 1. Brand voice — Korean rules

- 톤: **간결하고 절제된**, premium magazine. 과장 ❌, 감탄사 ❌.
- 마침표 `.` 와 가운뎃점 `·` 만 사용. 느낌표 ❌.
- 줄바꿈은 호흡 단위로. 광고 문구가 아니라 *시*에 가깝게.
- Konglish는 **브랜드/제품 용어에만 한정** (퍼포먼스, 그립, 레인지 ✅) — 일반 문장은 순한국어.
- 영어 고유명사(`Gauge Golf`, `PGA`, `MVP`)는 그대로 둠.
- 띄어쓰기·맞춤법: 국립국어원 표준 준수.

---

## 2. Meta / SEO (`app/layout.tsx`)

| Key | EN | **KO** |
| --- | --- | --- |
| `title` | Gauge Golf — One Glove. Every Condition. | **Gauge Golf — 하나의 장갑. 모든 환경.** |
| `description` | A universal performance golf glove designed for grip, wrist stability and long practice sessions in heat, rain and all-weather training. | **그립, 손목 안정성, 그리고 장시간 연습을 위해 설계된 유니버설 퍼포먼스 골프 장갑. 더위에도, 비에도, 모든 날씨 속에서.** |
| OG/Twitter short | Universal performance golf glove. Built in public. | **유니버설 퍼포먼스 골프 장갑. 모든 과정을, 공개합니다.** |

---

## 3. Navigation (`components/site/nav.tsx`)

| EN | **KO** |
| --- | --- |
| Story | **스토리** |
| Product | **프로덕트** |
| Testing | **테스팅** |
| FAQ | **FAQ** |
| Reserve *(button)* | **예약하기** |
| Wordmark `GAUGE` | **GAUGE** *(keep Latin)* |

---

## 4. Hero (`components/site/hero.tsx`)

**Eyebrow chip**
> EN: `Built in public`
> **KO: 모든 과정을, 공개합니다**

**Headline (H1)** — keep line break, keep gold on the last word
> EN:
> ```
> One Glove.
> Every Condition.
> ```
> **KO:**
> ```
> 하나의 장갑.
> 모든 환경.
> ```
> *// 환경 = "condition / environment" — premium, single-syllable rhythm matching EN.*

**Subline**
> EN: Built for golfers who practice until their hands hurt.
> **KO: 손이 아플 때까지, 연습하는 골퍼를 위하여.**

**CTAs**
| EN | **KO** |
| --- | --- |
| Reserve Early Access | **사전 예약하기** |
| Watch Testing Videos | **테스팅 영상 보기** |

**Bottom stat strip**
| Label EN | Value EN | Label KO | **Value KO** |
| --- | --- | --- | --- |
| Designed for | Long practice sessions | 설계 | **장시간 연습 세션** |
| Built for | Heat · Rain · Humidity | 제작 | **더위 · 비 · 습기** |
| Focus | One glove. Built right. | 집중 | **하나의 장갑. 제대로.** |

---

## 5. Ribbon marquee (`components/site/ribbon.tsx`)

| EN | **KO** |
| --- | --- |
| Heat | **더위** |
| Rain | **비** |
| Grip | **그립** |
| **400 swings per session** *(gold)* | **한 세션 400스윙** |
| Wrist stability | **손목 안정성** |
| All weather | **모든 날씨** |
| Universal performance | **유니버설 퍼포먼스** |
| **Built in public** *(gold)* | **공개 제작** |
| One glove | **하나의 장갑** |
| Built right first | **처음부터 제대로** |

---

## 6. Testing (`components/site/testing.tsx`)

**Section head**
| Field | EN | **KO** |
| --- | --- | --- |
| Num | 02 — Testing | **02 — 테스팅** |
| Title | Real testing.<br>Real feedback. | **실제 테스트.<br>실제 피드백.** |
| Lede | Driving ranges, factory floors, sweat and weather — the videos speak for themselves. | **드라이빙 레인지, 공장 현장, 땀과 날씨 — 영상이 모든 것을 말해줍니다.** |

**Season label**
> EN: Season 1 — Building from scratch
> **KO: 시즌 1 — 처음부터 만들어가는 과정**

**Tile labels**
| EN | **KO** |
| --- | --- |
| The Idea | **아이디어** |
| MVP · Elastic Band | **MVP · 일래스틱 밴드** |
| Real Course | **실제 코스** |
| Wedge Practice | **웨지 연습** |
| Sweat Problem | **땀 문제** |
| PGA Academy | **PGA 아카데미** |
| Arrived in China | **중국 도착** |
| To the Factory | **공장으로** |
| Material Selection | **소재 선정** |
| First Sample | **첫 샘플** |
| Field Testing | **필드 테스팅** |
| Korea Launch | **한국 출시** |

**Locations**
| EN | **KO** |
| --- | --- |
| Bali | **발리** |
| Range | **레인지** |
| On Course | **온 코스** |
| +30°C | **+30°C** |
| PGA | **PGA** |
| China | **중국** |
| Guangzhou | **광저우** |
| Factory | **공장** |

**Chips**
| EN | **KO** | Notes |
| --- | --- | --- |
| Day {n} | **DAY {n}** | *Keep Latin — looks more premium on small chip.* Alt: `{n}일차` if fully localized look is preferred. |
| Coming soon | **곧 공개** | |
| Coming June | **6월 공개** | |

---

## 7. Product / Blueprint (`components/site/blueprint.tsx`)

**Section head**
| Field | EN | **KO** |
| --- | --- | --- |
| Num | 03 — The Product | **03 — 프로덕트** |
| Title | Built for<br>repetition. | **반복을 위한<br>설계.** |
| Lede | A universal performance golf glove designed for grip, wrist stability and repetitive practice in heat, rain and all-weather training. | **그립과 손목 안정성을 위해 설계된 유니버설 퍼포먼스 골프 장갑. 더위, 비, 그리고 모든 날씨 속 반복 연습을 위하여.** |

**Features (5)**
| # | EN heading | EN body | **KO heading** | **KO body** |
| --- | --- | --- | --- | --- |
| 01 | Wrist Stability | Additional support designed for repetitive swing sessions. | **손목 안정성** | **반복적인 스윙 세션을 위한 추가 지지력.** |
| 02 | Grip Pattern | Consistent grip performance in sweat and rain. | **그립 패턴** | **땀과 비에도 일정한 그립 성능.** |
| 03 | Reinforced Palm | Built for high-volume driving range practice. | **강화 손바닥** | **고강도 드라이빙 레인지 연습을 위해 제작.** |
| 04 | Microfiber Construction | Soft feel with improved durability. | **마이크로파이버 구조** | **부드러운 착용감, 향상된 내구성.** |
| 05 | Universal Conditions | Designed for indoor, outdoor, humid and wet environments. | **유니버설 컨디션** | **실내, 야외, 습한 환경과 젖은 환경까지.** |

---

## 8. Founder (`components/site/founder.tsx`)

**Section head**
| Field | EN | **KO** |
| --- | --- | --- |
| Num | 04 — The Founder | **04 — 파운더** |
| Title | Built<br>independently. | **독립적으로,<br>만들어가다.** |
| Lede | One golfer, building a better glove for high-volume practice — and sharing the process openly. | **한 명의 골퍼. 더 나은 장갑을 직접 만들고, 그 모든 과정을 공개합니다.** |

**Photo caption**
> EN: Konstantin · Founder
> **KO: 콘스탄틴 · 파운더**

**Body**
> EN: *I’m a handicap-16 golfer who spends most of his time **practicing on driving ranges**.*
> **KO: 저는 핸디캡 16의 골퍼입니다. 대부분의 시간을, <span class="gold">드라이빙 레인지에서 연습하며</span> 보냅니다.**

> EN: After dealing with wrist pain, glove durability issues and inconsistent grip during long practice sessions, I started building a glove focused on repetitive training and all-weather performance.
> **KO: 오랜 연습 끝에 찾아온 손목 통증, 장갑의 내구성 문제, 그리고 일정하지 않은 그립. 이 문제들을 해결하기 위해 — 반복 훈련과 전천후 퍼포먼스를 위한 장갑을, 직접 만들기 시작했습니다.**

> EN: Gauge Golf documents that process publicly through real testing, manufacturing and field feedback.
> **KO: Gauge Golf는 실제 테스트, 제조 과정, 그리고 필드 피드백까지 — 모든 과정을 공개적으로 기록합니다.**

**Signature block**
| EN | **KO** |
| --- | --- |
| Konstantin Kazarichuk | **콘스탄틴 카자리축** |
| Founder · hello@gauge-golf.com | **파운더 · hello@gauge-golf.com** |

---

## 9. Metrics (`components/site/metrics.tsx`)

**Section head**
| Field | EN | **KO** |
| --- | --- | --- |
| Num | 05 — At a Glance | **05 — 한눈에 보기** |
| Title | What Gauge<br>stands for. | **Gauge가<br>추구하는 것.** |
| Lede | A simple, focused product — built for repetition, weather and the player who actually practices. | **단순하고 집중된 하나의 제품. 반복, 날씨, 그리고 실제로 연습하는 골퍼를 위해.** |

**Metric tiles**
| Value EN | Label EN | **Value KO** | **Label KO** |
| --- | --- | --- | --- |
| 400 | Swings Per Session | **400** | **한 세션 스윙 수** |
| All-Weather | Heat · Rain · Humidity | **올웨더** | **더위 · 비 · 습기** |
| Founder-Led | Independent Product Build | **파운더 주도** | **독립적인 제품 제작** |
| One Product | Built Right First | **하나의 제품** | **처음부터 제대로** |

---

## 10. Early Access form (`components/site/reserve.tsx`)

**Section head**
| EN | **KO** |
| --- | --- |
| 06 — Early Access | **06 — 사전 예약** |
| Early Access *(H2)* | **사전 예약** |
| *Lede:* Early access requests are currently handled directly by the founder before the first production batch opens. | **첫 생산이 시작되기 전까지, 모든 사전 예약은 파운더가 직접 처리합니다.** |

**Success state**
| EN | **KO** |
| --- | --- |
| Confirmed *(chip)* | **신청 완료** |
| You’re on the list. | **예약이 완료되었습니다.** |
| You’ll receive future updates and first-batch access information directly from Konstantin. | **이후의 업데이트와 첫 생산 배치 정보는 콘스탄틴이 직접 안내해 드립니다.** |

**Field labels & placeholders**
| EN label | EN placeholder | **KO label** | **KO placeholder** |
| --- | --- | --- | --- |
| Name | First and last | **이름** | **성과 이름** |
| Email | you@email.com | **이메일** | **you@email.com** |
| Country | — | **국가** | — |
| State *(US)* | Choose your state | **주** | **주를 선택해 주세요** |
| Where are you based? | City, country | **어디에 거주하시나요?** | **도시, 국가** |
| Glove hand | Choose | **장갑 방향** | **선택** |
| Glove size | Choose | **장갑 사이즈** | **선택** |
| Need help with size? | — | **사이즈가 헷갈리시나요?** | — |
| + Add details (optional) | — | **+ 세부 정보 추가 (선택)** | — |
| Instagram / X | @handle | **인스타그램 / X** | **@계정** |
| Handicap *(optional)* | Choose one | **핸디캡** *(선택)* | **선택해 주세요** |
| Message *(optional)* | Anything you’d like Konstantin to know. | **메시지** *(선택)* | **콘스탄틴에게 전하고 싶은 말씀을 자유롭게 남겨주세요.** |

**Country chips**
| EN | **KO** |
| --- | --- |
| USA | **미국** |
| Korea | **한국** |
| Japan | **일본** |
| Singapore | **싱가포르** |
| Other | **그 외** |

**Glove hand options**
| EN | **KO** |
| --- | --- |
| Left | **왼손** |
| Right | **오른손** |
| Both | **양손** |
| Not sure | **모름** |

**Handicap options**
| EN | **KO** |
| --- | --- |
| Beginner | **입문** |
| 20+ | **20+** |
| 10–20 | **10–20** |
| Under 10 | **10 미만** |
| Scratch | **스크래치** |
| Don’t know | **모름** |

**Buttons & footnotes**
| EN | **KO** |
| --- | --- |
| Reserve a Pair | **사전 예약하기** |
| Sending… | **전송 중…** |
| No spam · Founder replies directly | **스팸 없음 · 파운더가 직접 답변드립니다** |

**Optional label suffix**
| EN | **KO** |
| --- | --- |
| optional | **선택** |

---

## 11. FAQ (`components/site/faq.tsx`)

**Section head**
| Field | EN | **KO** |
| --- | --- | --- |
| Num | 07 — FAQ | **07 — FAQ** |
| Title | Straight<br>answers. | **솔직한<br>답변.** |
| Lede | Founder-led project. Ask anything missing — hello@gauge-golf.com. | **파운더가 직접 운영하는 프로젝트입니다. 궁금한 점이 있다면 — hello@gauge-golf.com 으로 문의해 주세요.** |

**Q & A**
| # | EN | **KO** |
| --- | --- | --- |
| 1 Q | Is the glove available now? | **지금 바로 구매할 수 있나요?** |
| 1 A | Early samples are currently being tested before the first production batch release. | **현재 첫 생산 배치를 앞두고, 초기 샘플을 테스트하는 단계입니다.** |
| 2 Q | How do orders work? | **주문은 어떻게 진행되나요?** |
| 2 A | Early requests are currently handled directly through email and social media. | **현재는 이메일과 소셜 미디어를 통해 직접 처리하고 있습니다.** |
| 3 Q | Do you ship internationally? | **해외 배송이 가능한가요?** |
| 3 A | Yes. International shipping will be available for the first production batch. | **네. 첫 생산 배치부터 해외 배송이 가능합니다.** |
| 4 Q | Why only one product? | **왜 제품이 하나뿐인가요?** |
| 4 A | Gauge Golf is focused on building one great glove first. | **Gauge Golf는 먼저 하나의 완성된 장갑을 만드는 데 집중하고 있습니다.** |
| 5 Q | Is this a company? | **회사인가요?** |
| 5 A | Gauge Golf is currently an independent founder-led project. | **Gauge Golf는 현재 파운더가 직접 운영하는 독립 프로젝트입니다.** |

---

## 12. Footer (`components/site/footer.tsx`)

**Tagline (under logo)**
> EN: Universal performance golf glove.<br>Built in public.
> **KO: 유니버설 퍼포먼스 골프 장갑.<br>모든 과정을, 공개합니다.**

**Column headings**
| EN | **KO** |
| --- | --- |
| Navigation | **메뉴** |
| Contact | **문의** |
| Legal | **약관** |

**Navigation links**
| EN | **KO** |
| --- | --- |
| Story | **스토리** |
| Product | **프로덕트** |
| Testing | **테스팅** |
| Early Access | **사전 예약** |
| FAQ | **FAQ** |

**Legal links**
| EN | **KO** |
| --- | --- |
| Privacy Policy | **개인정보 처리방침** |
| Terms of Sale | **판매 약관** |
| Shipping & Delivery | **배송 안내** |
| Refunds & Returns | **환불 및 반품** |
| About this site | **사이트 정보** |

**Copyright line**
> EN: © Gauge Golf · Operated by Konstantin Kazarichuk · Independent seller
> **KO: © Gauge Golf · 운영 콘스탄틴 카자리축 · 독립 판매자**

---

## 13. Sticky mobile CTA (`components/site/sticky-cta.tsx`)

| EN | **KO** |
| --- | --- |
| Early access · Founder-led | **사전 예약 · 파운더 직접 운영** |
| Reserve | **예약하기** |

---

## 14. Premium brand taglines *(optional — for packaging, posters, IG)*

영어 헤드라인을 그대로 옮기지 않고 — 한국 골프 / 럭셔리 브랜딩에 어울리는 **에디토리얼 톤** 라인 세트.
사용자가 첨부한 윤동주 · 김소월 · 고은 · 서정주의 미니멀한 호흡을 참고함.

| # | KO | EN gloss |
| --- | --- | --- |
| 1 | **손이 기억할 때까지.** | *Until the hands remember.* |
| 2 | **하나의 장갑. 모든 환경.** | *One glove. Every condition.* |
| 3 | **반복이, 사람을 만든다.** | *Repetition shapes a person.* |
| 4 | **더위에도, 비에도. 한결같이.** | *In heat. In rain. Unchanged.* |
| 5 | **오늘 한 번 더, 휘두를 수 있도록.** | *So you can swing one more time today.* |
| 6 | **연습은, 거짓말하지 않는다.** | *Practice never lies.* |

이 라인들은 다음 매체에서 효과적임:
- **글러브 패키징** (한 줄 디보스/포일 가공)
- **캠페인 포스터** (세리프 — Noto Serif KR / Sandoll Myungjo)
- **인스타 캐러셀 마지막 카드**
- **유튜브 시즌 인트로 자막**

---

## 15. Open questions for the Korean reviewer

Please confirm these editorial choices before lock-in:

1. **`파운더` vs `창립자`** — kept `파운더` for premium/startup tone (Toss/Daangn style). Switch to `창립자` if too startup-y?
2. **`프로덕트` vs `제품`** — kept `프로덕트` in nav for visual rhythm with English siblings. Body copy uses `제품`. OK?
3. **`사전 예약` vs `얼리 액세스`** — primary copy uses **`사전 예약`** (cleaner, more trusted). `얼리 액세스` only as alt in chip context. Confirm?
4. **`DAY 1` chip** — kept Latin. Confirm vs `1일차`.
5. **`핸디캡 16`** — Korean golfers commonly say `핸디 16`. Use the casual form?
6. **`콘스탄틴 카자리축`** — official Korean transliteration of the founder’s name. Confirm spelling preference (alt: `콘스탄틴 카자리척`).
7. **`유니버설 퍼포먼스`** — premium Konglish, but heavy. Acceptable, or prefer `모든 환경을 위한 퍼포먼스`?

---

*End of document. Hand off to native reviewer.*

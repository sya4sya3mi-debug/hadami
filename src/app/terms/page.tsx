import "@/styles/hadami-tokens.css";
import Link from "next/link";

const sections = [
  {
    title: "第1条（適用）",
    paragraphs: [
      "本利用規約（以下「本規約」）は、HADAMI（以下「本サービス」）の利用に関する条件を、本サービスを利用するすべてのユーザー（以下「ユーザー」）と運営者との間で定めるものです。",
      "ユーザーは、本サービスに登録した時点で、本規約に同意したものとみなします。",
    ],
  },
  {
    title: "第2条（定義）",
    items: [
      "「本サービス」とは、運営者が提供するコスメ成分検索アプリ「HADAMI」およびそれに付随するすべてのサービスを指します。",
      "「ユーザー」とは、本サービスに登録し、利用するすべての個人を指します。",
      "「コンテンツ」とは、ユーザーが本サービスにアップロードまたは入力したテキスト、画像、データ等を指します。",
    ],
  },
  {
    title: "第3条（アカウント）",
    paragraphs: [
      "ユーザーは、Googleアカウントまたはメールアドレス・パスワードにより本サービスに登録できます。",
      "ユーザーは、自身のアカウント情報を適切に管理する責任を負います。アカウントの第三者への譲渡・貸与は禁止します。",
      "ユーザーは、設定画面からいつでもアカウントを削除することができます。アカウント削除時には、以下のデータが完全に削除され、復元はできません：プロフィール情報、保存したコスメデータ・成分情報、スキンケアルーティンの構成データ、成分図鑑の収集データ、スキャン履歴・成分プロファイルデータ、アップロードしたコスメ画像、端末に保存されたローカルデータ。",
      "ただし、不正利用防止のため、メールアドレスに紐づくスキャン回数の利用実績は、アカウント削除後も保持されます。同一メールアドレスで再登録された場合、スキャン回数は引き継がれ、リセットされません。",
    ],
  },
  {
    title: "第4条（サービス内容）",
    paragraphs: ["本サービスは、以下の機能を提供します。"],
    items: [
      "AI（人工知能）を活用した化粧品パッケージの成分検索",
      "成分図鑑（発見した成分をコレクションする機能、★レアリティ付き）",
      "スキンケアルーティン（朝・夜のスキンケアルーティンを管理する機能）",
      "ルーティンチェックリスト（毎日のスキンケア完了を記録・連続達成日数を管理する機能）",
      "マイコスメ（スキャンした製品の写真管理・お気に入り・カテゴリ管理）",
      "スキャン履歴・成分プロファイルに基づくパーソナライズド商品レコメンド（楽天市場アフィリエイト連携）",
    ],
    paragraphsAfter: [
      "無料アカウントにつきスキャン回数は30回までとなります。スキャン回数はメールアドレス単位で管理され、アカウントを削除して再登録した場合でもリセットされません。また、1アカウントあたりの画像保存数には上限が設けられる場合があります。機能や利用条件は今後変更される場合があります。",
    ],
  },
  {
    title: "第5条（禁止事項）",
    paragraphs: ["ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。"],
    items: [
      "法令または公序良俗に違反する行為",
      "犯罪行為に関連する行為",
      "本サービスの運営を妨害する行為",
      "他のユーザーの情報を不正に収集する行為",
      "本サービスのリバースエンジニアリング、逆コンパイル、逆アセンブル",
      "本サービスを商業目的で無断利用する行為",
      "不正アクセスまたはこれを試みる行為",
      "本サービスを利用した虚偽または誤解を招く情報の発信",
      "APIへの過剰なリクエスト送信等、サーバーに過度な負荷をかける行為",
      "その他、運営者が不適切と判断する行為",
    ],
  },
  {
    title: "第6条（免責事項）",
    paragraphs: [
      "本サービスが提供する成分検索結果はAI（人工知能）による自動検索であり、その正確性・完全性を保証するものではありません。成分情報の誤り、欠落、または最新でない情報が含まれる可能性があります。",
      "本サービスは成分の分類と一般的な特性を紹介するものであり、特定のコスメの効能効果を評価・保証するものではありません。医薬品、医薬部外品等に関する判断は、必ず専門家にご相談ください。",
      "本サービスの利用に起因してユーザーに生じたいかなる損害についても、運営者の故意または重過失による場合を除き、運営者は責任を負いません。",
      "本サービスは現状有姿（AS IS）で提供されます。運営者は、本サービスの中断、停止、終了、利用不能、データの消失等について、一切の責任を負いません。",
    ],
  },
  {
    title: "第7条（アフィリエイト広告について）",
    paragraphs: [
      "本サービスの商品レコメンド機能では、楽天アフィリエイトプログラムを利用しています。",
      "ユーザーが本サービス内のリンクを経由して商品を購入した場合、運営者はアフィリエイト報酬を受け取ることがあります。",
      "商品レコメンドの内容は、ユーザーのスキャン履歴・成分プロファイルに基づいてアルゴリズムにより自動生成されており、特定の商品の効果効能を保証するものではありません。",
    ],
  },
  {
    title: "第8条（知的財産権）",
    paragraphs: [
      "本サービスに関する著作権、商標権、その他一切の知的財産権は、運営者または正当な権利者に帰属します。",
      "ユーザーが本サービスにアップロードしたコンテンツ（コスメ画像等）の著作権はユーザーに帰属します。ただし、ユーザーは、本サービスの提供・改善に必要な範囲で運営者がこれらのコンテンツを利用することを許諾します。",
    ],
  },
  {
    title: "第9条（サービスの変更・停止）",
    paragraphs: [
      "運営者は、事前の通知なく本サービスの内容を変更し、または本サービスの提供を停止・終了することができるものとします。",
      "運営者は、本サービスの変更・停止・終了によりユーザーに生じたいかなる損害についても、責任を負わないものとします。",
    ],
  },
  {
    title: "第10条（利用規約の変更）",
    paragraphs: [
      "運営者は、ユーザーへの事前の通知または承諾を要することなく、必要に応じていつでも本規約を変更することができるものとします。",
      "変更後の利用規約は、本ページに掲載した時点から効力を生じるものとします。変更後に本サービスを利用した場合、ユーザーは変更後の規約に同意したものとみなします。ユーザーは定期的に本ページを確認することを推奨いたします。",
    ],
  },
  {
    title: "第11条（準拠法・管轄裁判所）",
    paragraphs: [
      "本規約の解釈および適用は、日本法に準拠するものとします。",
      "本サービスに関連して生じた紛争については、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。",
    ],
  },
  {
    title: "第12条（お問い合わせ）",
    paragraphs: ["本規約に関するお問い合わせは、以下のいずれかよりご連絡ください。"],
    contact: {
      service: "HADAMI（ハダミ）",
      links: [
        { label: "X（@miomio_beauty）DM", href: "https://x.com/miomio_beauty" },
        { label: "みおのミハダノート お問い合わせフォーム", href: "https://blog-engine.com/contact/" },
      ],
    },
  },
];

export default function TermsPage() {
  return (
    <div className="hd-root hd-softa" data-density="compact">
      <div
        className="hd"
        style={{
          minHeight: "100vh",
          background: "var(--hd-bg)",
          color: "var(--hd-ink)",
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 22px 56px" }}>
          <Link
            href="/"
            className="hd-mono hd-caps"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--hd-ink-60)",
              textDecoration: "none",
              marginBottom: 28,
            }}
          >
            ← Back · 戻る
          </Link>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <div
              className="hd-mono hd-caps"
              style={{ color: "var(--hd-ink-40)", marginBottom: 10 }}
            >
              Terms of Use
            </div>
            <h1
              className="hd-serif"
              style={{
                fontSize: 32,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: "0 0 14px",
              }}
            >
              利用規約<span style={{ fontStyle: "italic", color: "var(--hd-moss)" }}>.</span>
            </h1>
            <p
              className="hd-mono"
              style={{
                fontSize: 11,
                color: "var(--hd-ink-60)",
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              制定日: 2026.04.04 · 最終更新: 2026.04.19
            </p>
          </div>

          {/* Sections */}
          <div>
            {sections.map((section, i) => (
              <section
                key={section.title}
                style={{
                  paddingTop: 22,
                  paddingBottom: 22,
                  borderTop: i === 0 ? "1px solid var(--hd-ink)" : "1px solid var(--hd-hair)",
                  borderBottom:
                    i === sections.length - 1 ? "1px solid var(--hd-ink)" : "none",
                }}
              >
                <div
                  className="hd-mono hd-caps"
                  style={{ color: "var(--hd-ink-40)", marginBottom: 6 }}
                >
                  No. {String(i + 1).padStart(2, "0")}
                </div>
                <h2
                  className="hd-serif"
                  style={{
                    fontSize: 17,
                    margin: "0 0 14px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {section.title}
                </h2>

                {section.paragraphs?.map((p) => (
                  <p
                    key={p}
                    style={{
                      fontFamily: "var(--hd-sans)",
                      fontSize: 13,
                      lineHeight: 1.85,
                      color: "var(--hd-ink-60)",
                      margin: "0 0 10px",
                    }}
                  >
                    {p}
                  </p>
                ))}

                {section.items && (
                  <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none" }}>
                    {section.items.map((item, idx) => (
                      <li
                        key={item}
                        style={{
                          fontFamily: "var(--hd-sans)",
                          fontSize: 12.5,
                          lineHeight: 1.85,
                          color: "var(--hd-ink-60)",
                          paddingLeft: 30,
                          position: "relative",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          className="hd-mono"
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 1,
                            fontSize: 9,
                            color: "var(--hd-ink-40)",
                            letterSpacing: "0.03em",
                          }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {section.paragraphsAfter?.map((p) => (
                  <p
                    key={p}
                    style={{
                      fontFamily: "var(--hd-sans)",
                      fontSize: 13,
                      lineHeight: 1.85,
                      color: "var(--hd-ink-60)",
                      margin: "12px 0 0",
                    }}
                  >
                    {p}
                  </p>
                ))}

                {section.contact && (
                  <div style={{ marginTop: 10 }}>
                    <div
                      className="hd-mono hd-caps"
                      style={{ color: "var(--hd-ink-40)", marginBottom: 6 }}
                    >
                      Service
                    </div>
                    <p
                      className="hd-serif"
                      style={{
                        fontSize: 14,
                        margin: "0 0 8px",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {section.contact.service}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {section.contact.links.map((l) => (
                        <a
                          key={l.href}
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hd-mono"
                          style={{
                            fontSize: 12,
                            color: "var(--hd-ink)",
                            textDecoration: "underline",
                            textUnderlineOffset: 3,
                            letterSpacing: "0.02em",
                          }}
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

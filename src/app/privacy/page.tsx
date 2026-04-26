import "@/styles/hadami-tokens.css";
import Link from "next/link";

const sections = [
  {
    title: "1. はじめに",
    content: `HADAMI（以下「本サービス」）は、個人が運営するコスメ成分検索アプリです。本サービスの運営者（以下「運営者」）は、ユーザーの皆さまの個人情報の保護を重要な責務と考え、個人情報の保護に関する法律（以下「個人情報保護法」）を遵守し、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。`,
  },
  {
    title: "2. 収集する情報",
    content: `本サービスでは、以下の情報を収集します。`,
    subsections: [
      {
        subtitle: "（1）アカウント情報",
        items: [
          "メールアドレス（メール・パスワード認証の場合）",
          "Googleアカウント情報（Google OAuth認証の場合：メールアドレス、表示名）",
          "ニックネーム（ユーザーが設定する表示名）",
        ],
      },
      {
        subtitle: "（2）コスメデータ",
        items: [
          "スキャンした化粧品のパッケージ画像",
          "コスメ名・ブランド名",
          "成分情報（AI検索により取得）",
          "コスメタイプ（化粧水、美容液、クリーム等のカテゴリ）",
        ],
      },
      {
        subtitle: "（3）利用データ",
        items: [
          "スキャン回数（利用上限の管理のため）",
          "朝・夜のスキンケアルーティン構成",
          "成分図鑑の収集状況",
          "ルーティンチェックリストの完了状況・連続達成日数",
          "成分の出会い頻度（レコメンド生成のため）",
        ],
      },
      {
        subtitle: "（4）端末に保存される情報",
        items: [
          "アプリの表示状態に関するデータ（localStorageを使用）",
          "ルーティンの連続記録・チェック状態",
          "画像キャッシュ（Service Workerによるオフライン対応）",
          "※本サービスでは、第三者のトラッキングCookieは使用しておりません。",
        ],
      },
    ],
  },
  {
    title: "3. 利用目的",
    content: `収集した個人情報は、以下の目的のために利用します。`,
    items: [
      "アカウントの作成・認証・管理",
      "AI（人工知能）を活用した化粧品成分の検索サービスの提供",
      "成分図鑑・スキンケアルーティン・ルーティンチェックリスト機能の提供",
      "スキャン回数の管理（利用上限管理）",
      "スキャン履歴・成分プロファイルに基づくパーソナライズド商品レコメンド機能の提供",
      "本サービスの維持・運営・改善",
      "お問い合わせへの対応",
    ],
  },
  {
    title: "4. 第三者への情報提供",
    content: `本サービスでは、サービスの提供にあたり、以下の第三者サービスを利用しています。ユーザーの個人情報は、以下に記載する目的の範囲内で各サービス提供者に提供されます。`,
    subsections: [
      {
        subtitle: "（1）Supabase, Inc.（米国）",
        items: [
          "提供する情報：アカウント情報、コスメデータ、利用データ",
          "利用目的：データベース、ユーザー認証の提供",
        ],
      },
      {
        subtitle: "（2）Cloudflare, Inc.（米国）",
        items: [
          "提供する情報：ユーザーがアップロードしたコスメ画像",
          "利用目的：Cloudflare R2を利用した画像ファイルの保存・配信",
          "※画像はユーザーごとに分離された領域に保存されます。",
        ],
      },
      {
        subtitle: "(3) Google LLC(米国)",
        items: [
          "提供する情報：OAuth認証に必要な情報、スキャンした化粧品のパッケージ画像",
          "利用目的：Googleアカウントによるログイン認証、Google Gemini APIによるAI成分検索・画像認識",
          "※画像はAI検索処理のために送信されます。Googleの利用規約・プライバシーポリシーに従いデータが取り扱われます。",
        ],
      },
      {
        subtitle: "（4）a9t9 software GmbH（ドイツ）",
        items: [
          "提供する情報：スキャンした化粧品のパッケージ画像",
          "利用目的：OCR.space APIを利用した画像からのテキスト抽出（成分表示の読み取り）",
          "※画像はテキスト抽出処理のためにのみ送信され、保存されません。",
        ],
      },
      {
        subtitle: "（5）Vercel Inc.（米国）",
        items: [
          "提供する情報：サーバーログ（IPアドレス等を含む場合があります）",
          "利用目的：本サービスのホスティング",
        ],
      },
      {
        subtitle: "（6）Google LLC（米国）— Google Analytics",
        items: [
          "提供する情報：アクセスログ（Cookie、IPアドレス等の匿名情報）",
          "利用目的：サービスの利用状況分析・改善",
          "※個人を特定できる情報は送信されません。",
        ],
      },
      {
        subtitle: "（7）楽天グループ株式会社（日本）",
        items: [
          "提供する情報：成分検索結果に基づく検索キーワード",
          "利用目的：楽天市場商品検索APIを利用したパーソナライズド商品レコメンドの提供",
          "※アフィリエイトリンクを使用しており、ユーザーがリンク経由で商品を購入した場合、運営者がアフィリエイト報酬を受け取ることがあります。",
        ],
      },
    ],
  },
  {
    title: "5. 外国にある第三者への個人データの提供",
    content: `本サービスでは、上記第4条に記載のとおり、米国およびドイツに所在する事業者が提供するクラウドサービスを利用しています。これにより、ユーザーの個人データが日本国外で取り扱われる場合があります。各事業者は、それぞれのプライバシーポリシーに基づき適切なデータ保護措置を講じています。`,
  },
  {
    title: "6. 安全管理措置",
    content: `運営者は、個人情報の漏えい、滅失、毀損等を防止するため、以下の安全管理措置を講じています。`,
    items: [
      "データベースの行レベルセキュリティ（RLS）により、ユーザーは自身のデータのみアクセス可能",
      "すべての通信におけるHTTPS（SSL/TLS）暗号化",
      "認証されたユーザーのみがデータ操作を行える認証制御",
      "パッケージ画像はCloudflare R2上でユーザーごとに分離されたストレージ領域に保存",
      "CSP（Content Security Policy）ヘッダーによるスクリプト注入の防止",
    ],
  },
  {
    title: "7. データの保持と削除",
    content: `ユーザーの個人情報は、アカウントが存続する間保持されます。ユーザーは、本サービスの「設定」画面からいつでもアカウントを削除することができます。アカウント削除時には、以下のデータがすべて削除されます。`,
    items: [
      "プロフィール情報（ニックネーム等）",
      "保存したコスメデータ・成分情報",
      "スキンケアルーティンの構成データ",
      "成分図鑑の収集データ",
      "スキャン履歴・成分プロファイルデータ",
      "アップロードしたコスメ画像",
      "端末に保存されたローカルデータ",
    ],
    note: "※ただし、不正利用防止（アカウント再作成によるスキャン回数のリセット防止）のため、メールアドレスに紐づくスキャン回数の利用実績は、アカウント削除後も保持されます。この情報はスキャン回数の管理のみに使用され、それ以外の目的で利用されることはありません。",
  },
  {
    title: "8. ユーザーの権利",
    content: `個人情報保護法に基づき、ユーザーは以下の権利を有します。これらの権利を行使される場合は、下記のお問い合わせ窓口までご連絡ください。`,
    items: [
      "個人情報の開示を請求する権利",
      "個人情報の訂正・追加・削除を請求する権利",
      "個人情報の利用停止・消去を請求する権利",
      "個人情報の第三者への提供停止を請求する権利",
    ],
    note: "※アカウントの削除は、設定画面から直接行うことも可能です。",
  },
  {
    title: "9. アナリティクス・トラッキングについて",
    content: `本サービスでは、サービスの改善を目的として、Google LLC が提供する「Google Analytics 4」を使用しています。Google Analytics は、Cookieを使用してユーザーのアクセス状況（ページ閲覧数、滞在時間、利用端末の種類等）を収集・分析します。収集されたデータはGoogleのサーバーに送信され、Googleのプライバシーポリシーに従って管理されます。`,
    subsections: [
      {
        subtitle: "収集される主な情報",
        items: [
          "ページの閲覧情報（URL、滞在時間等）",
          "アクセス元情報（ブラウザの種類、OS、画面サイズ等)",
          "Cookieおよび類似技術による匿名識別子",
          "※個人を特定できる情報（氏名・メールアドレス等）は収集しません。",
        ],
      },
      {
        subtitle: "オプトアウト（計測の無効化）",
        items: [
          "Google アナリティクス オプトアウト アドオン（ブラウザ拡張機能）をインストールすることで、計測を無効にできます。",
          "https://tools.google.com/dlpage/gaoptout",
          "※広告目的のサードパーティCookieは使用しておりません。",
        ],
      },
    ],
  },
  {
    title: "10. 未成年の利用について",
    content: `本サービスは、未成年の方もご利用いただけますが、16歳未満の方がご利用になる場合は、保護者の同意を得たうえでご利用いただくことを推奨いたします。`,
  },
  {
    title: "11. プライバシーポリシーの変更",
    content: `運営者は、必要に応じて本ポリシーの内容を変更することがあります。重要な変更を行う場合は、本サービス上での告知等、適切な方法でユーザーにお知らせいたします。変更後のプライバシーポリシーは、本ページに掲載した時点から効力を生じるものとします。`,
  },
  {
    title: "12. お問い合わせ窓口",
    content: `個人情報の取扱いに関するお問い合わせは、以下までご連絡ください。`,
    contact: {
      service: "HADAMI（ハダミ）",
      email: "miomio30beauty@gmail.com",
    },
  },
];

const paragraphStyle: React.CSSProperties = {
  fontFamily: "var(--hd-sans)",
  fontSize: 13,
  lineHeight: 1.85,
  color: "var(--hd-ink-60)",
  margin: "0 0 10px",
};

const itemStyle: React.CSSProperties = {
  fontFamily: "var(--hd-sans)",
  fontSize: 12.5,
  lineHeight: 1.85,
  color: "var(--hd-ink-60)",
  paddingLeft: 30,
  position: "relative",
  marginBottom: 4,
};

export default function PrivacyPage() {
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

          <div style={{ marginBottom: 36 }}>
            <div
              className="hd-mono hd-caps"
              style={{ color: "var(--hd-ink-40)", marginBottom: 10 }}
            >
              Privacy Policy
            </div>
            <h1
              className="hd-serif"
              style={{
                fontSize: 30,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                margin: "0 0 14px",
              }}
            >
              プライバシーポリシー
              <span style={{ fontStyle: "italic", color: "var(--hd-moss)" }}>.</span>
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

                {section.content && <p style={paragraphStyle}>{section.content}</p>}

                {section.subsections?.map((sub) => (
                  <div key={sub.subtitle} style={{ marginTop: 14, marginBottom: 8 }}>
                    <h3
                      className="hd-mono hd-caps"
                      style={{
                        color: "var(--hd-ink-60)",
                        marginBottom: 8,
                      }}
                    >
                      {sub.subtitle}
                    </h3>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {sub.items.map((item, idx) => (
                        <li key={item} style={itemStyle}>
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
                            {item.startsWith("※") ? "" : String(idx + 1).padStart(2, "0")}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {section.items && (
                  <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none" }}>
                    {section.items.map((item, idx) => (
                      <li key={item} style={itemStyle}>
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

                {section.note && (
                  <p
                    style={{
                      fontFamily: "var(--hd-sans)",
                      fontSize: 11,
                      lineHeight: 1.7,
                      color: "var(--hd-ink-40)",
                      marginTop: 12,
                      marginBottom: 0,
                    }}
                  >
                    {section.note}
                  </p>
                )}

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
                    <a
                      href={`mailto:${section.contact.email}`}
                      className="hd-mono"
                      style={{
                        fontSize: 12,
                        color: "var(--hd-ink)",
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {section.contact.email}
                    </a>
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

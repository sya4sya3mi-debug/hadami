import Link from "next/link";

const sections = [
  {
    title: "1. はじめに",
    content: `HADAMI（以下「本サービス」）は、個人が運営するコスメ成分解析アプリです。本サービスの運営者（以下「運営者」）は、ユーザーの皆さまの個人情報の保護を重要な責務と考え、個人情報の保護に関する法律（以下「個人情報保護法」）を遵守し、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。`,
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
          "成分情報（AI解析により取得）",
          "コスメタイプ",
        ],
      },
      {
        subtitle: "（3）利用データ",
        items: [
          "スキャン回数（無料利用上限の管理のため）",
          "朝・夜のマイスキンケアデッキ構成",
          "成分図鑑の収集状況",
        ],
      },
      {
        subtitle: "（4）端末に保存される情報",
        items: [
          "アプリの表示状態に関するデータ（localStorageを使用）",
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
      "AI（人工知能）を活用した化粧品成分の解析サービスの提供",
      "成分図鑑・マイスキンケアデッキ機能の提供",
      "スキャン回数の管理（無料ベータ版の利用上限管理）",
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
          "提供する情報：アカウント情報、コスメデータ、利用データ、アップロード画像",
          "利用目的：データベース、ユーザー認証、ファイルストレージの提供",
        ],
      },
      {
        subtitle: "（2）Anthropic, PBC（米国）",
        items: [
          "提供する情報：スキャンした化粧品のパッケージ画像",
          "利用目的：AIによる成分の自動解析・特定",
          "※画像はAI解析処理のために送信され、Anthropic社により継続的に保存されることはありません。",
        ],
      },
      {
        subtitle: "（3）Google LLC（米国）",
        items: [
          "提供する情報：OAuth認証に必要な情報",
          "利用目的：Googleアカウントによるログイン認証",
        ],
      },
      {
        subtitle: "（4）Vercel Inc.（米国）",
        items: [
          "提供する情報：サーバーログ（IPアドレス等を含む場合があります）",
          "利用目的：本サービスのホスティング",
        ],
      },
      {
        subtitle: "（5）Tesseract.js（ブラウザ内OCR）",
        items: [
          "※OCR処理はユーザーのブラウザ内で完結し、外部サーバーへのデータ送信は行われません。",
        ],
      },
    ],
  },
  {
    title: "5. 外国にある第三者への個人データの提供",
    content: `本サービスでは、上記第4条に記載のとおり、米国に所在する事業者が提供するクラウドサービスを利用しています。これにより、ユーザーの個人データが日本国外（主に米国）で取り扱われる場合があります。各事業者は、それぞれのプライバシーポリシーに基づき適切なデータ保護措置を講じています。`,
  },
  {
    title: "6. 安全管理措置",
    content: `運営者は、個人情報の漏えい、滅失、毀損等を防止するため、以下の安全管理措置を講じています。`,
    items: [
      "データベースの行レベルセキュリティ（RLS）により、ユーザーは自身のデータのみアクセス可能",
      "すべての通信におけるHTTPS（SSL/TLS）暗号化",
      "認証されたユーザーのみがデータ操作を行える認証制御",
      "パッケージ画像はユーザーごとに分離されたストレージ領域に保存",
    ],
  },
  {
    title: "7. データの保持と削除",
    content: `ユーザーの個人情報は、アカウントが存続する間保持されます。ユーザーは、本サービスの「設定」画面からいつでもアカウントを削除することができます。アカウント削除時には、以下のデータがすべて削除されます。`,
    items: [
      "プロフィール情報（ニックネーム等）",
      "保存したコスメデータ・成分情報",
      "マイスキンケアデッキの構成データ",
      "成分図鑑の収集データ",
      "アップロードしたコスメ画像",
      "端末に保存されたローカルデータ",
    ],
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
    content: `本サービスでは、Google Analyticsをはじめとする第三者のアクセス解析ツールやトラッキングツールは一切使用しておりません。また、広告目的の識別子やサードパーティCookieも使用していません。`,
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

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}
    >
      <div className="px-5 pt-8 pb-16 max-w-md mx-auto">
        {/* ヘッダー */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm mb-6"
          style={{ color: "#5BBFAD" }}
        >
          ← 戻る
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-lg font-bold mb-1" style={{ color: "#2D2D2D" }}>
            プライバシーポリシー
          </h1>
          <p className="text-xs" style={{ color: "#9B9B9B" }}>
            制定日：2026年4月4日
          </p>
        </div>

        {/* セクション */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-white rounded-2xl p-4 shadow-sm"
              style={{ border: "1px solid #F5E6EF" }}
            >
              <h2 className="text-sm font-bold mb-2" style={{ color: "#5BBFAD" }}>
                {section.title}
              </h2>
              <p className="text-xs leading-relaxed mb-2" style={{ color: "#4A4A4A" }}>
                {section.content}
              </p>

              {section.subsections?.map((sub) => (
                <div key={sub.subtitle} className="mb-3 last:mb-0">
                  <h3 className="text-xs font-bold mb-1" style={{ color: "#6B6B6B" }}>
                    {sub.subtitle}
                  </h3>
                  <ul className="space-y-0.5">
                    {sub.items.map((item) => (
                      <li
                        key={item}
                        className="text-xs leading-relaxed pl-3"
                        style={{ color: "#4A4A4A" }}
                      >
                        {item.startsWith("※") ? item : `・${item}`}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {section.items && (
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="text-xs leading-relaxed pl-3"
                      style={{ color: "#4A4A4A" }}
                    >
                      ・{item}
                    </li>
                  ))}
                </ul>
              )}

              {section.note && (
                <p className="text-xs mt-2" style={{ color: "#9B9B9B" }}>
                  {section.note}
                </p>
              )}

              {section.contact && (
                <div className="mt-2 text-xs" style={{ color: "#4A4A4A" }}>
                  <p>サービス名：{section.contact.service}</p>
                  <p>
                    メール：
                    <a
                      href={`mailto:${section.contact.email}`}
                      style={{ color: "#5BBFAD" }}
                    >
                      {section.contact.email}
                    </a>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

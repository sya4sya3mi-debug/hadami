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
      "「本サービス」とは、運営者が提供するコスメ成分解析アプリ「HADAMI」およびそれに付随するすべてのサービスを指します。",
      "「ユーザー」とは、本サービスに登録し、利用するすべての個人を指します。",
      "「コンテンツ」とは、ユーザーが本サービスにアップロードまたは入力したテキスト、画像、データ等を指します。",
    ],
  },
  {
    title: "第3条（アカウント）",
    paragraphs: [
      "ユーザーは、Googleアカウントまたはメールアドレス・パスワードにより本サービスに登録できます。",
      "ユーザーは、自身のアカウント情報を適切に管理する責任を負います。アカウントの第三者への譲渡・貸与は禁止します。",
      "ユーザーは、設定画面からいつでもアカウントを削除することができます。アカウント削除時には、関連するすべてのデータ（製品データ、図鑑データ、スキンケアデッキデータ、アップロード画像等）が完全に削除され、復元はできません。",
    ],
  },
  {
    title: "第4条（サービス内容）",
    paragraphs: [
      "本サービスは、以下の機能を提供します。",
    ],
    items: [
      "AI（人工知能）を活用した化粧品パッケージの成分解析",
      "成分図鑑（発見した成分をコレクションする機能）",
      "マイスキンケアデッキ（朝・夜のスキンケアルーティンを管理する機能）",
      "スキャン履歴の管理",
    ],
    paragraphsAfter: [
      "本サービスは現在ベータ版として提供されており、無料アカウントにつきスキャン回数は10回までとなります。機能や利用条件は今後変更される場合があります。",
    ],
  },
  {
    title: "第5条（禁止事項）",
    paragraphs: [
      "ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。",
    ],
    items: [
      "法令または公序良俗に違反する行為",
      "犯罪行為に関連する行為",
      "本サービスの運営を妨害する行為",
      "他のユーザーの情報を不正に収集する行為",
      "本サービスのリバースエンジニアリング、逆コンパイル、逆アセンブル",
      "本サービスを商業目的で無断利用する行為",
      "不正アクセスまたはこれを試みる行為",
      "本サービスを利用した虚偽または誤解を招く情報の発信",
      "その他、運営者が不適切と判断する行為",
    ],
  },
  {
    title: "第6条（免責事項）",
    paragraphs: [
      "本サービスが提供する成分解析結果はAI（人工知能）による自動解析であり、その正確性・完全性を保証するものではありません。成分情報の誤り、欠落、または最新でない情報が含まれる可能性があります。",
      "本サービスは成分の分類と一般的な特性を紹介するものであり、特定の製品の効能効果を評価・保証するものではありません。医薬品、医薬部外品等に関する判断は、必ず専門家にご相談ください。",
      "本サービスの利用に起因してユーザーに生じたいかなる損害についても、運営者の故意または重過失による場合を除き、運営者は責任を負いません。",
      "本サービスは現状有姿（AS IS）で提供されます。運営者は、本サービスの中断、停止、終了、利用不能、データの消失等について、一切の責任を負いません。",
    ],
  },
  {
    title: "第7条（知的財産権）",
    paragraphs: [
      "本サービスに関する著作権、商標権、その他一切の知的財産権は、運営者または正当な権利者に帰属します。",
      "ユーザーが本サービスにアップロードしたコンテンツ（製品画像等）の著作権はユーザーに帰属します。ただし、ユーザーは、本サービスの提供・改善に必要な範囲で運営者がこれらのコンテンツを利用することを許諾します。",
    ],
  },
  {
    title: "第8条（サービスの変更・停止）",
    paragraphs: [
      "運営者は、事前の通知なく本サービスの内容を変更し、または本サービスの提供を停止・終了することができるものとします。",
      "運営者は、本サービスの変更・停止・終了によりユーザーに生じたいかなる損害についても、責任を負わないものとします。",
    ],
  },
  {
    title: "第9条（利用規約の変更）",
    paragraphs: [
      "運営者は、必要に応じて本規約を変更することができるものとします。重要な変更を行う場合は、本サービス上での告知等、適切な方法でユーザーにお知らせいたします。",
      "変更後の利用規約は、本ページに掲載した時点から効力を生じるものとします。変更後に本サービスを利用した場合、ユーザーは変更後の規約に同意したものとみなします。",
    ],
  },
  {
    title: "第10条（準拠法・管轄裁判所）",
    paragraphs: [
      "本規約の解釈および適用は、日本法に準拠するものとします。",
      "本サービスに関連して生じた紛争については、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。",
    ],
  },
  {
    title: "第11条（お問い合わせ）",
    paragraphs: [
      "本規約に関するお問い合わせは、以下までご連絡ください。",
    ],
    contact: {
      service: "HADAMI（ハダミ）",
      email: "miomio30beauty@gmail.com",
    },
  },
];

export default function TermsPage() {
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
            利用規約
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

              {section.paragraphs?.map((p) => (
                <p
                  key={p}
                  className="text-xs leading-relaxed mb-2 last:mb-0"
                  style={{ color: "#4A4A4A" }}
                >
                  {p}
                </p>
              ))}

              {section.items && (
                <ul className="space-y-0.5 mb-2">
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

              {section.paragraphsAfter?.map((p) => (
                <p
                  key={p}
                  className="text-xs leading-relaxed mb-2 last:mb-0"
                  style={{ color: "#4A4A4A" }}
                >
                  {p}
                </p>
              ))}

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

/* eslint-disable react/no-unescaped-entities -- React PDF Text contains document copy, not HTML markup. */
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type {
  ConventionRepresentative,
  ConventionSignatureBlock,
  SubsidyConventionPdfData,
} from "./types";

const assetPath = (...parts: string[]) =>
  ["pdf-lab", "templates", "convention", "assets", ...parts].join("/");

Font.register({
  family: "Montserrat",
  fonts: [
    { src: assetPath("fonts", "Montserrat-Regular.ttf"), fontWeight: 400 },
    { src: assetPath("fonts", "Montserrat-Medium.ttf"), fontWeight: 500 },
    { src: assetPath("fonts", "Montserrat-SemiBold.ttf"), fontWeight: 600 },
    { src: assetPath("fonts", "Montserrat-Bold.ttf"), fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const red = "#ef3338";
const ink = "#09192e";
const rule = "#d7d7d7";

const styles = StyleSheet.create({
  page: {
    paddingTop: 92,
    paddingRight: 56.7,
    paddingBottom: 66,
    paddingLeft: 56.7,
    color: ink,
    backgroundColor: "#ffffff",
    fontFamily: "Montserrat",
    fontSize: 10,
  },
  widePage: {
    paddingTop: 92,
    paddingRight: 42.4,
    paddingBottom: 66,
    paddingLeft: 42.4,
    color: ink,
    backgroundColor: "#ffffff",
    fontFamily: "Montserrat",
    fontSize: 10,
  },
  header: {
    position: "absolute",
    top: 23.5,
    left: 27.4,
    right: 56.7,
    height: 48,
  },
  logoMark: {
    position: "absolute",
    top: 4.2,
    left: 0,
    width: 30.8,
    height: 30.8,
  },
  logoWords: {
    position: "absolute",
    top: 0,
    left: 28.5,
    fontSize: 13,
    lineHeight: 1.18,
    fontWeight: 700,
  },
  logoRed: { color: red },
  contact: {
    position: "absolute",
    top: 0,
    right: 12.5,
    width: 180,
    textAlign: "right",
    fontSize: 9,
    lineHeight: 1.18,
    fontWeight: 600,
  },
  email: {
    color: "#0057c8",
    textDecoration: "underline",
    fontSize: 10,
  },
  footer: {
    position: "absolute",
    left: 70,
    bottom: 37,
    width: 456,
    textAlign: "center",
    fontSize: 9,
  },
  pageNumber: {
    position: "absolute",
    left: 70,
    bottom: 24,
    width: 456,
    textAlign: "center",
    fontSize: 9,
  },
  coverTitle: {
    marginTop: -2,
    textAlign: "center",
    fontSize: 17,
    lineHeight: 1.25,
  },
  period: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: 500,
  },
  periodValue: { color: red },
  intro: { marginTop: 29 },
  partyLabel: { marginTop: 16, fontWeight: 700 },
  party: { marginTop: 16 },
  partyName: { fontWeight: 500 },
  closing: { marginTop: 18 },
  article: { marginTop: 15 },
  firstArticle: { marginTop: 1 },
  articleTitle: {
    paddingBottom: 3,
    borderBottomWidth: 2,
    borderBottomColor: red,
    fontSize: 12,
    lineHeight: 1.2,
    fontWeight: 600,
  },
  paragraph: { marginTop: 6 },
  paragraphGap: { marginTop: 13 },
  bold: { fontWeight: 700 },
  medium: { fontWeight: 500 },
  list: { marginTop: 3, marginLeft: 18 },
  listItem: { flexDirection: "row" },
  bullet: { width: 18 },
  listText: { flexGrow: 1, flexBasis: 0 },
  table: { marginTop: 14 },
  tableHeader: {
    height: 29,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: red,
    color: "#ffffff",
    fontWeight: 500,
  },
  tableRow: {
    minHeight: 25,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: rule,
  },
  dateCell: { width: "27%", paddingHorizontal: 8, textAlign: "center" },
  descriptionCell: {
    width: "53%",
    paddingHorizontal: 8,
    textAlign: "center",
  },
  amountCell: {
    width: "20%",
    paddingHorizontal: 8,
    textAlign: "right",
  },
  emptyCell: {
    width: "100%",
    paddingHorizontal: 8,
    textAlign: "center",
    color: "#566173",
  },
  totalLabel: {
    width: "80%",
    paddingHorizontal: 16,
    textAlign: "left",
    fontWeight: 500,
  },
  totalAmount: {
    width: "20%",
    paddingHorizontal: 8,
    textAlign: "right",
  },
  continuation: { marginTop: -1 },
  emphasis: { marginTop: 23, fontWeight: 700 },
  signatureSection: { marginTop: 25 },
  signatureGrid: { flexDirection: "row", marginTop: 12 },
  signatureColumn: { width: "50%", paddingHorizontal: 5 },
  signatureAssociation: { fontSize: 12, fontWeight: 500 },
  signatureRole: { fontSize: 11 },
  signatureName: { marginTop: -1 },
  signatureSpace: { height: 66 },
  signatureMeta: { flexDirection: "row", marginTop: 3 },
  signatureMetaLabel: { width: 46, fontSize: 11 },
  signatureMetaValue: { fontSize: 8, fontWeight: 600, paddingTop: 2 },
});

function Header() {
  return (
    <View style={styles.header} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- React PDF Image does not support the HTML alt prop. */}
      <Image style={styles.logoMark} src={assetPath("logo-mark.png")} />
      <Text style={styles.logoWords}>
        CENTRALE{"\n"}LILLE{"\n"}
        <Text style={styles.logoRed}>ASSOCIATIONS</Text>
      </Text>
      <Text style={styles.contact}>
        Ecole Centrale de Lille{"\n"}Cité Scientifique - CS 20048{"\n"}59651 -
        Villeneuve d'Ascq{"\n"}
        <Text style={styles.email}>cla@centralelille.fr</Text>
      </Text>
    </View>
  );
}

function Footer() {
  return (
    <>
      <Text style={styles.footer} fixed>
        Centrale Lille Associations est une association loi 1901 déposée à la
        préfecture de Lille
      </Text>
      <Text
        style={styles.pageNumber}
        fixed
        render={({ pageNumber, totalPages }) =>
          `Tous droits réservés - Page ${pageNumber} sur ${totalPages}`
        }
      />
    </>
  );
}

function Article({
  number,
  title,
  first = false,
  children,
}: {
  number: number;
  title: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={first ? styles.firstArticle : styles.article}>
      <Text style={styles.articleTitle} minPresenceAhead={38}>
        ARTICLE {number} - {title}
      </Text>
      {children}
    </View>
  );
}

function BulletList({ children }: { children: string[] }) {
  return (
    <View style={styles.list}>
      {children.map((item) => (
        <View key={item} style={styles.listItem} wrap={false}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function representativesSentence(representatives: ConventionRepresentative[]) {
  return representatives
    .map((representative) => `${representative.name} (${representative.role})`)
    .join(" et ");
}

function SignatureColumn({
  signature,
}: {
  signature: ConventionSignatureBlock;
}) {
  return (
    <View style={styles.signatureColumn}>
      <Text style={styles.signatureAssociation}>
        Pour {signature.associationName},
      </Text>
      <Text style={styles.signatureRole}>
        {signature.signatoryRole ? `${signature.signatoryRole},` : ""}
      </Text>
      <Text style={styles.signatureName}>{signature.signatoryName}</Text>
      <View style={styles.signatureSpace} />
      <View style={styles.signatureMeta}>
        <Text style={styles.signatureMetaLabel}>Fait à</Text>
        <Text style={styles.signatureMetaValue}>{signature.city}</Text>
      </View>
      <View style={styles.signatureMeta}>
        <Text style={styles.signatureMetaLabel}>le</Text>
        <Text style={styles.signatureMetaValue}>{signature.date}</Text>
      </View>
    </View>
  );
}

export function SubsidyConventionDocument({
  data,
}: {
  data: SubsidyConventionPdfData;
}) {
  return (
    <Document
      title={`Convention de subvention ${data.period}`}
      author="Centrale Lille Associations"
      subject="Convention de subvention"
    >
      <Page size="A4" style={styles.page}>
        <Header />
        <Footer />
        <Text style={styles.coverTitle}>CONVENTION DE SUBVENTION</Text>
        <Text style={styles.period}>
          PÉRIODE <Text style={styles.periodValue}>{data.period}</Text>
        </Text>

        <Text style={styles.intro}>
          La présente convention (la «convention») est établie entre les parties
          suivantes:
        </Text>
        <Text style={styles.partyLabel}>d'une part,</Text>
        <View style={styles.party}>
          <Text style={styles.partyName}>
            L'association {data.firstParty.associationName}
          </Text>
          <Text>Dont le siège est à {data.firstParty.address},</Text>
          <Text>
            Représentée par{" "}
            {representativesSentence(data.firstParty.representatives)}, ci-après
            désignée par « CLA »
          </Text>
        </View>
        <Text style={styles.partyLabel}>et</Text>
        <Text style={styles.partyLabel}>d'autre part,</Text>
        <View style={styles.party}>
          <Text style={styles.partyName}>
            L'association {data.secondParty.associationName}
          </Text>
          <Text>Dont le siège est au {data.secondParty.address},</Text>
          <Text>
            Représentée par{" "}
            {representativesSentence(data.secondParty.representatives)}
          </Text>
          <Text>ci-après désignée par « L'association »</Text>
        </View>
        <Text style={styles.closing}>
          Les parties visées ci-dessus ont convenu d'adhérer à la convention
          selon les termes et conditions ci-après.
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Header />
        <Footer />
        <Article number={1} title="OBJET DE LA CONVENTION" first>
          <Text style={styles.paragraph}>
            La convention fixe les droits et obligations ainsi que les termes et
            conditions applicables à la subvention octroyée aux bénéficiaires
            lors d'une demande de subvention effectuée lors du CA Event de
            décembre pour la couverture des dépenses liées à l'organisation des
            événements, telles que décrites à l'article 2.
          </Text>
        </Article>

        <Article number={2} title="DESCRIPTION DE LA SUBVENTION">
          <Text style={styles.paragraph}>
            La subvention est accordée pour les dépenses suivantes :
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader} wrap={false}>
              <Text style={styles.dateCell}>ACCORDÉ LE</Text>
              <Text style={styles.descriptionCell}>DESCRIPTION</Text>
              <Text style={styles.amountCell}>MONTANT</Text>
            </View>
            {data.expenses.length === 0 ? (
              <View style={styles.tableRow} wrap={false}>
                <Text style={styles.emptyCell}>Aucune dépense</Text>
              </View>
            ) : (
              data.expenses.map((expense, index) => (
                <View
                  key={`${expense.grantedOn}-${expense.description}-${index}`}
                  style={styles.tableRow}
                  wrap={false}
                >
                  <Text style={[styles.dateCell, styles.medium]}>
                    {expense.grantedOn}
                  </Text>
                  <Text style={styles.descriptionCell}>
                    {expense.description}
                  </Text>
                  <Text style={styles.amountCell}>{expense.amount}</Text>
                </View>
              ))
            )}
            <View style={styles.tableRow} wrap={false}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{data.totalAmount}</Text>
            </View>
          </View>
        </Article>

        <Article number={3} title="MONTANT TOTAL DE LA SUBVENTION">
          <Text style={styles.paragraph}>
            Le montant total accordé à l'association est de{" "}
            {data.totalAmount.replace(/€$/u, "EUR")}.
          </Text>
        </Article>

        <Article number={5} title="DROITS ET OBLIGATIONS DE CLA">
          <Text style={styles.paragraph}>
            CLA s'engage à mettre à disposition le montant de la subvention qui
            figure à l'article 3 au plus tard 10 jours après signature de la
            convention.
          </Text>
          <Text style={styles.paragraphGap}>
            CLA se réserve le droit de réclamer le remboursement complet ou
            partiel de la somme versée auprès de l'association en cas de
            non-respect de ses engagements décrits à l'article 6.
          </Text>
        </Article>

        <Article number={6} title="DROITS ET OBLIGATIONS DE L'ASSOCIATION">
          <Text style={styles.paragraph}>L'association s'engage à :</Text>
          <BulletList>
            {[
              "Utiliser le montant mis à disposition par CLA dans le seul et unique but de financer les événements listés à l'article 2",
              "Retourner les fonds non dépensés, soit par virement bancaire, soit par déduction sur une prochaine demande de subvention",
            ]}
          </BulletList>
          <Text style={styles.paragraphGap}>
            L'association ayant reçu une subvention devra faire un compte rendu
            post-événement et fournir au CA Élèves, dans un délai d'un mois
            après la fin de l'événement, un retour détaillé incluant :
          </Text>
          <BulletList>
            {[
              "Un bilan du déroulement de l'événement.",
              "Un bilan financier précisant l'utilisation de la subvention accordée.",
              "Si le CA Élèves en fait la demande, les justificatifs comptables correspondants.",
            ]}
          </BulletList>
        </Article>
      </Page>

      <Page size="A4" style={styles.widePage}>
        <Header />
        <Footer />
        <View style={styles.continuation}>
          <BulletList>
            {[
              "Un suivi des subventions : tenir à jour un suivi précis de toutes les subventions perçues pour l'événement ou les projets concernés, en indiquant leur origine, leur montant et leur utilisation.",
            ]}
          </BulletList>
          <Text style={styles.paragraphGap}>
            En cas de demande d'autres subventions pour un événement ou un
            projet ayant déjà bénéficié d'un soutien financier du CA Élèves,
            l'association devra :
          </Text>
          <BulletList>
            {[
              "Informer le CA Élèves des subventions déjà obtenues.",
              "Fournir un bilan d'étape sur les fonds déjà alloués, précisant l'état d'avancement du projet et l'utilisation prévue des fonds supplémentaires.",
              "Le non-respect de ces obligations pourra entraîner des restrictions pour l'attribution de futures subventions.",
            ]}
          </BulletList>
          <Text style={styles.emphasis}>
            Si l'événement génère un bénéfice dépassant 20 % du financement
            accordé par le CA Événements, l'association devra restituer une
            partie de la subvention. Le montant à restituer sera calculé au
            prorata de la part de financement apportée par le CA Événements par
            rapport aux bénéfices totaux obtenus pour l'événement.
          </Text>
        </View>

        <Article number={7} title="LITIGES">
          <Text style={styles.paragraph}>
            En cas de contestation sur la validité, l'interprétation ou
            l'exécution de la convention, les parties s'accordent de tout mettre
            en oeuvre afin de régler leur différend à l'amiable. Si le désaccord
            persiste entre les parties, le litige sera soumis aux juridictions
            françaises de Lille.
          </Text>
        </Article>

        <Article number={8} title="MODIFICATIONS DE LA CONVENTION">
          <Text style={styles.paragraph}>
            En cas d'imprévu majeur nécessitant une révision de la convention
            pour s'adapter aux nouvelles spécificités de la subvention, celle-ci
            peut être modifiée, sauf si les modifications sont susceptibles de
            remettre en cause la décision d'attribution de la subvention ou
            d'enfreindre le principe d'égalité de traitement des candidats.
          </Text>
          <Text style={styles.paragraphGap}>
            Les deux parties peuvent demander des modifications.
          </Text>
          <Text style={[styles.paragraphGap, styles.bold]}>Procédure :</Text>
          <Text>
            La partie qui demande une modification doit soumettre une demande de
            modification signée à l'autre partie.
          </Text>
          <Text style={styles.paragraphGap}>
            La demande de modification doit comprendre:
          </Text>
          <BulletList>
            {["les motivations", "les pièces justificatives appropriées"]}
          </BulletList>
          <Text style={styles.paragraphGap}>
            Si la partie destinataire de la demande marque son accord, elle
            signe la modification dans un délai de 30 jours. Dans le cas
            contraire, elle doit notifier formellement son désaccord dans le
            même délai. Le délai peut être prolongé, s'il y a lieu, aux fins de
            l'examen de la demande. En l'absence de notification dans ce délai,
            la demande est considérée comme rejetée.
          </Text>
          <Text style={styles.paragraphGap}>
            Toute modification <Text style={styles.bold}>entre en vigueur</Text>{" "}
            le jour où la partie destinataire la signe.
          </Text>
          <Text style={styles.paragraphGap}>
            Toute modification <Text style={styles.bold}>prend effet</Text> à la
            date convenue par les parties ou, en l'absence d'un tel accord, à la
            date à laquelle la modification entre en vigueur.
          </Text>
        </Article>
      </Page>

      <Page size="A4" style={styles.page}>
        <Header />
        <Footer />
        <Article number={9} title="DURÉE ET RÉSILIATION" first>
          <Text style={styles.paragraph}>
            Afin de laisser le temps aux parties de vérifier le respect de leurs
            engagements, la convention est valable jusqu'à 2 ans suivant la date
            d'entrée en vigueur.
          </Text>
          <Text style={styles.paragraphGap}>
            En cas de non-respect par l'une des deux parties de leurs
            engagements, la convention pourra être résiliée de plein droit par
            l'une des parties. Cette résiliation devient effective 2 semaines
            après l'envoi par la partie qui en fait la demande d'une lettre
            recommandée avec accusé de réception.
          </Text>
          <Text style={styles.paragraphGap}>
            En cas de résiliation, CLA sera en droit d'exiger le remboursement
            de la somme versée à l'association.
          </Text>
        </Article>

        <Article number={10} title="ENTRÉE EN VIGUEUR DE LA CONVENTION">
          <Text style={styles.paragraph}>
            La convention entre en vigueur le jour de sa signature par les deux
            parties.
          </Text>
        </Article>

        <View style={styles.signatureSection}>
          <Text style={styles.articleTitle}>SIGNATURES</Text>
          <View style={styles.signatureGrid}>
            <SignatureColumn signature={data.secondPartySignature} />
            <SignatureColumn signature={data.firstPartySignature} />
          </View>
        </View>
      </Page>
    </Document>
  );
}

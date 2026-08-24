import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { FinancementExpenseRow, FinancementPdfData } from "./types";

const assetPath = (...parts: string[]) =>
  ["pdf-lab", "templates", "financement", "assets", ...parts].join("/");

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

const red = "#e12f30";
const ink = "#0c1b2e";
const line = "#d9d9d9";

const styles = StyleSheet.create({
  page: {
    paddingTop: 118,
    paddingRight: 40,
    paddingBottom: 72,
    paddingLeft: 42.5,
    backgroundColor: "#ffffff",
    color: ink,
    fontFamily: "Montserrat",
    fontSize: 11,
  },
  logo: {
    position: "absolute",
    left: 23,
    top: 12,
    width: 100.5,
    height: 100.5,
  },
  address: {
    position: "absolute",
    left: 330,
    top: 36,
    width: 215,
    textAlign: "right",
    fontSize: 9,
    lineHeight: 1.2,
    fontWeight: 600,
  },
  email: {
    position: "absolute",
    left: 450,
    top: 69,
    width: 95,
    color: "#1155cc",
    textDecoration: "underline",
    fontSize: 10,
    fontWeight: 600,
  },
  footer: {
    position: "absolute",
    left: 70,
    bottom: 25,
    width: 456,
    textAlign: "center",
    fontSize: 8,
    lineHeight: 1.55,
  },
  title: { textAlign: "center", fontSize: 22, marginTop: 6 },
  period: { textAlign: "center", fontSize: 13, marginTop: 4, fontWeight: 500 },
  periodValue: { color: red },
  infoBlock: { marginTop: 22 },
  infoLabel: { fontWeight: 700 },
  paragraph: { marginTop: 16 },
  bold: { fontWeight: 700 },
  table: { marginTop: 8, width: "100%" },
  tableHeader: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: red,
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 500,
  },
  tableRow: {
    minHeight: 25,
    flexDirection: "row",
    alignItems: "center",
    borderBottomColor: line,
    borderBottomWidth: 1,
    fontSize: 11,
  },
  dateColumn: { width: "25%", paddingHorizontal: 8, textAlign: "center" },
  descriptionColumn: {
    width: "55%",
    paddingHorizontal: 8,
    textAlign: "center",
  },
  amountColumn: {
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
  totalRow: {
    minHeight: 25,
    flexDirection: "row",
    alignItems: "center",
    fontSize: 11,
  },
  totalLabel: { width: "80%", paddingRight: 17, textAlign: "right" },
  totalAmount: { width: "20%", paddingHorizontal: 8, textAlign: "right" },
  list: { marginTop: 3, marginLeft: 18 },
  listItem: { flexDirection: "row" },
  bullet: { width: 18 },
  listText: { flexGrow: 1, flexBasis: 0 },
  emphasis: { marginTop: 20, fontWeight: 700 },
  signatureRow: { marginTop: 30, flexDirection: "row" },
  signature: { width: "50%" },
  signatureTitle: { fontWeight: 600, textDecoration: "underline" },
});

function Header() {
  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- le composant Image de React PDF ne prend pas de prop alt. */}
      <Image fixed src={assetPath("logo.jpg")} style={styles.logo} />
      <Text fixed style={styles.address}>
        Association « Centrale Lille Associations »{"\n"}
        Cité Scientifique - CS 20048{"\n"}
        59651 - Villeneuve d’Ascq
      </Text>
      <Text fixed style={styles.email}>
        cla@centralelille.fr
      </Text>
    </>
  );
}

function Footer() {
  return (
    <Text
      fixed
      style={styles.footer}
      render={({ pageNumber, totalPages }) =>
        `Centrale Lille Associations est une association loi 1901 déposée à la préfecture de Lille\nTous droits réservés - Page ${pageNumber} sur ${totalPages}`
      }
    />
  );
}

function ExpenseTable({
  rows,
  total,
}: {
  rows: FinancementExpenseRow[];
  total: string;
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader} minPresenceAhead={49}>
        <Text style={styles.dateColumn}>ACCORDÉ LE</Text>
        <Text style={styles.descriptionColumn}>DESCRIPTION</Text>
        <Text style={styles.amountColumn}>MONTANT</Text>
      </View>
      {rows.length === 0 ? (
        <View style={styles.tableRow} wrap={false}>
          <Text style={styles.emptyCell}>Aucune dépense</Text>
        </View>
      ) : (
        rows.map((row, index) => (
          <View
            key={`${row.date}-${row.description}-${index}`}
            style={styles.tableRow}
            wrap={false}
          >
            <Text style={styles.dateColumn}>{row.date}</Text>
            <Text style={styles.descriptionColumn}>{row.description}</Text>
            <Text style={styles.amountColumn}>{row.amount}</Text>
          </View>
        ))
      )}
      <View style={styles.totalRow} wrap={false}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalAmount}>{total}</Text>
      </View>
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

export function FinancementDocument({ data }: { data: FinancementPdfData }) {
  return (
    <Document
      title={`Ordre de financement ${data.period}`}
      author="Centrale Lille Associations"
    >
      <Page size={[596, 842]} style={styles.page} wrap>
        <Header />
        <Footer />

        <Text style={styles.title}>ORDRE DE FINANCEMENT</Text>
        <Text style={styles.period}>
          PÉRIODE <Text style={styles.periodValue}>{data.period}</Text>
        </Text>

        <View style={styles.infoBlock}>
          <Text>
            <Text style={styles.infoLabel}>Association : </Text>
            {data.associationName}
          </Text>
          <Text>
            <Text style={styles.infoLabel}>Statut : </Text>
            {data.associationStatus}
          </Text>
        </View>

        <Text style={styles.paragraph}>
          Suite à la demande de <Text style={styles.bold}>{data.requestContext}</Text> de
          l’association, il lui a été attribué le montant suivant par le
          Conseil d’Administration :
        </Text>
        <ExpenseTable rows={data.expenses} total={data.total} />

        <Text style={styles.paragraph}>
          Ce financement sera payé par le.a Trésorier.ière de Centrale Lille
          Associations à l’association, par un virement ou un chèque s’il est
          jugé plus pratique.
        </Text>

        <Text style={styles.paragraph}>
          La subvention est utilisable jusqu’au {data.usageDeadline}, pour
          financer uniquement les événements ci-dessus. Un audit ultérieur à
          la fin de l’exercice comptable constatera l’usage fait de la
          subvention, et ordonnera le cas échéant, le retour des fonds non
          dépensés conformément aux objets prescrits ci-dessus.
        </Text>

        <Text style={styles.paragraph}>
          L’association devra fournir au CA Élèves, dans un délai d’
          <Text style={styles.bold}>un mois après la fin de l’événement</Text>{" "}
          :
        </Text>
        <BulletList>
          {[
            "Un bilan du déroulement de l’événement.",
            "Un bilan financier précisant l’utilisation de la subvention accordée.",
            "Si le CA Élèves en fait la demande, les justificatifs comptables correspondants.",
            "Un suivi des subventions.",
          ]}
        </BulletList>

        <Text style={styles.emphasis} minPresenceAhead={80}>
          Si l’événement génère un bénéfice dépassant 20 % du financement
          accordé par le CA Événements, l’association devra restituer une
          partie de la subvention. Le montant à restituer sera calculé au
          prorata de la part de financement apportée par le CA Événements par
          rapport aux bénéfices totaux obtenus pour l’événement.
        </Text>

        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signature}>
            <Text style={styles.signatureTitle}>
              Le responsable de l’association,
            </Text>
            <Text>{data.responsibleName}</Text>
          </View>
          <View style={styles.signature}>
            <Text style={styles.signatureTitle}>
              Le secrétaire général de CLA
            </Text>
            <Text>{data.secretaryName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ExpenseBalancePdfData, ExpenseRow } from "./types";

const assetPath = (...parts: string[]) =>
  ["pdf-lab", "templates", "ndf-solde", "assets", ...parts].join("/");

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
  reportDate: { textAlign: "center", fontSize: 13, marginTop: 4 },
  author: { textAlign: "right", fontSize: 13, marginTop: 10, marginRight: 10 },
  paragraph: { marginTop: 5 },
  table: { marginTop: 5, width: "100%" },
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
  dateColumn: { width: "22.5%", paddingHorizontal: 8, textAlign: "center" },
  descriptionColumn: {
    width: "61%",
    paddingHorizontal: 8,
    textAlign: "center",
  },
  amountColumn: {
    width: "16.5%",
    paddingHorizontal: 8,
    textAlign: "right",
  },
  totalRow: {
    minHeight: 25,
    flexDirection: "row",
    alignItems: "center",
    fontSize: 11,
  },
  totalLabel: { width: "83.5%", paddingRight: 17, textAlign: "right" },
  totalAmount: { width: "16.5%", paddingHorizontal: 8, textAlign: "right" },
  conditionsTitle: { marginTop: 15, marginBottom: 2, fontWeight: 700 },
  paymentHeader: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: red,
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 500,
  },
  choiceColumn: { width: 85.5, textAlign: "center" },
  methodColumn: { width: 64.5, textAlign: "center" },
  detailsColumn: { flexGrow: 1, paddingLeft: 8 },
  paymentRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    borderBottomColor: line,
    borderBottomWidth: 1,
  },
  signatureRow: { marginTop: 28, flexDirection: "row" },
  signature: { width: "50%" },
  signatureTitle: { fontWeight: 600, textDecoration: "underline" },
  reconstitutionBanner: {
    marginTop: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: line,
    backgroundColor: "#f5f5f5",
  },
  reconstitutionText: {
    fontSize: 9,
    fontWeight: 500,
    textAlign: "center",
  },
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

function ExpenseTable({ rows, total }: { rows: ExpenseRow[]; total: string }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader} minPresenceAhead={49}>
        <Text style={styles.dateColumn}>DATE FACTURE</Text>
        <Text style={styles.descriptionColumn}>DESCRIPTION</Text>
        <Text style={styles.amountColumn}>MONTANT</Text>
      </View>
      {rows.map((row, index) => (
        <View
          key={`${row.date}-${row.description}-${index}`}
          style={styles.tableRow}
          wrap={false}
        >
          <Text style={styles.dateColumn}>{row.date}</Text>
          <Text style={styles.descriptionColumn}>{row.description}</Text>
          <Text style={styles.amountColumn}>{row.amount}</Text>
        </View>
      ))}
      <View style={styles.totalRow} wrap={false}>
        <Text style={styles.totalLabel}>TOTAL TTC</Text>
        <Text style={styles.totalAmount}>{total}</Text>
      </View>
    </View>
  );
}

function PaymentChoice({
  selected,
  method,
  details,
}: {
  selected: boolean;
  method: string;
  details?: string;
}) {
  return (
    <View style={styles.paymentRow} wrap={false}>
      <Text style={styles.choiceColumn}>{selected ? "X" : ""}</Text>
      <Text style={styles.methodColumn}>{method}</Text>
      <Text style={styles.detailsColumn}>{details}</Text>
    </View>
  );
}

export function ExpenseBalanceDocument({
  data,
}: {
  data: ExpenseBalancePdfData;
}) {
  return (
    <Document title="Note de frais" author="Centrale Lille Associations">
      <Page size={[596, 842]} style={styles.page} wrap>
        <Header />
        <Footer />

        <Text style={styles.title}>NOTE DE FRAIS</Text>
        <Text style={styles.reportDate}>{data.reportDate}</Text>
        <Text style={styles.author}>Par : {data.authorName}</Text>

        {data.reconstitutionNote && (
          <View style={styles.reconstitutionBanner} wrap={false}>
            <Text style={styles.reconstitutionText}>
              {data.reconstitutionNote}
            </Text>
          </View>
        )}

        <Text style={styles.paragraph}>Bonjour,</Text>
        <ExpenseTable rows={data.expenses} total={data.total} />

        <Text style={styles.conditionsTitle} minPresenceAhead={90}>
          Conditions de règlement :
        </Text>
        <View wrap={false}>
          <View style={styles.paymentHeader}>
            <Text style={styles.choiceColumn}>CHOIX</Text>
            <Text style={styles.methodColumn}>MOYEN</Text>
            <Text style={styles.detailsColumn}>
              INFORMATIONS SUPPLÉMENTAIRES
            </Text>
          </View>
          <PaymentChoice
            selected={data.paymentMethod === "cash"}
            method="Espèces"
          />
          <PaymentChoice
            selected={data.paymentMethod === "cheque"}
            method="Chèque"
            details={`Ordre : ${data.chequeOrder ?? ""}`}
          />
          <PaymentChoice
            selected={data.paymentMethod === "transfer"}
            method="Virement"
            details={`IBAN : ${data.iban ?? ""}`}
          />
        </View>

        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signature}>
            <Text style={styles.signatureTitle}>Le destinataire,</Text>
            <Text>{data.recipientName}</Text>
          </View>
          <View style={styles.signature}>
            <Text style={styles.signatureTitle}>Le Trésorier de CLA</Text>
            <Text>{data.treasurerName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

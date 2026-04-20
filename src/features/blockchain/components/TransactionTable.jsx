import { Link } from "react-router-dom";

function formatDateTime(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

function getAmountUnit(transaction) {
  return String(transaction?.amountUnit || "").toUpperCase() === "POL" ? "POL" : "GNT";
}

function TransactionTable({ transactions }) {
  return (
    <div className="panel">
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th className="data-table__col data-table__col--hash">해시</th>
              <th className="data-table__col data-table__col--party">From</th>
              <th className="data-table__col data-table__col--type">유형</th>
              <th className="data-table__col data-table__col--party">To</th>
              <th className="data-table__col data-table__col--amount">금액</th>
              <th className="data-table__col data-table__col--time">시간</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.txHash}>
                <td className="data-table__col data-table__col--hash">
                  <Link
                    to={`/blockchain/transactions/${transaction.txHash}`}
                    className="text-link table-ellipsis"
                    title={transaction.txHash}
                  >
                    {transaction.txHash}
                  </Link>
                </td>
                <td className="data-table__col data-table__col--party">
                  <strong className="table-ellipsis" title={transaction.fromOwnerTypeLabel}>
                    {transaction.fromOwnerTypeLabel}
                  </strong>
                  <p className="cell-subtext table-ellipsis" title={transaction.fromWalletAddress}>
                    <Link
                      to={`/blockchain/wallets/${transaction.fromWalletAddress}`}
                      className="text-link table-ellipsis"
                      title={transaction.fromWalletAddress}
                    >
                      {transaction.fromWalletAddress}
                    </Link>
                  </p>
                </td>
                <td className="data-table__col data-table__col--type">
                  <span className="table-ellipsis" title={transaction.eventTypeLabel}>
                    {transaction.eventTypeLabel}
                  </span>
                </td>
                <td className="data-table__col data-table__col--party">
                  <strong className="table-ellipsis" title={transaction.toOwnerTypeLabel}>
                    {transaction.toOwnerTypeLabel}
                  </strong>
                  <p className="cell-subtext table-ellipsis" title={transaction.toWalletAddress}>
                    <Link
                      to={`/blockchain/wallets/${transaction.toWalletAddress}`}
                      className="text-link table-ellipsis"
                      title={transaction.toWalletAddress}
                    >
                      {transaction.toWalletAddress}
                    </Link>
                  </p>
                </td>
                <td className="data-table__col data-table__col--amount">
                  <span
                    className="table-ellipsis"
                    title={`${transaction.amount.toLocaleString()} ${getAmountUnit(transaction)}`}
                  >
                    {transaction.amount.toLocaleString()} {getAmountUnit(transaction)}
                  </span>
                </td>
                <td className="data-table__col data-table__col--time">
                  <span className="table-ellipsis" title={formatDateTime(transaction.sentAt)}>
                    {formatDateTime(transaction.sentAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TransactionTable;

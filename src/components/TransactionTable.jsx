import { Link } from "react-router-dom";

function TransactionTable({ transactions }) {
  return (
    <div className="panel">
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>해시</th>
              <th>From</th>
              <th>유형</th>
              <th>To</th>
              <th>금액</th>
              <th>시간</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.txHash}>
                <td>
                  <Link to={`/transactions/${transaction.txHash}`} className="text-link">
                    {transaction.txHash}
                  </Link>
                </td>
                <td>
                  <strong>{transaction.fromOwnerTypeLabel}</strong>
                  <p className="cell-subtext">
                    <Link
                      to={`/wallets/${transaction.fromWalletAddress}`}
                      className="text-link"
                    >
                      {transaction.fromWalletAddress}
                    </Link>
                  </p>
                </td>
                <td>{transaction.eventTypeLabel}</td>
                <td>
                  <strong>{transaction.toOwnerTypeLabel}</strong>
                  <p className="cell-subtext">
                    <Link
                      to={`/wallets/${transaction.toWalletAddress}`}
                      className="text-link"
                    >
                      {transaction.toWalletAddress}
                    </Link>
                  </p>
                </td>
                <td>{transaction.amount.toLocaleString()} GT</td>
                <td>{new Date(transaction.sentAt).toLocaleString("ko-KR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TransactionTable;

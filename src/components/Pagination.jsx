function Pagination({ pageInfo, onPageChange }) {
  const { page, totalPages } = pageInfo;

  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="pagination">
      <button
        type="button"
        className="pagination__button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        이전
      </button>

      {pages.map((item) => (
        <button
          type="button"
          key={item}
          className={`pagination__button ${item === page ? "is-active" : ""}`}
          onClick={() => onPageChange(item)}
        >
          {item}
        </button>
      ))}

      <button
        type="button"
        className="pagination__button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        다음
      </button>
    </div>
  );
}

export default Pagination;

namespace Shift_Manager.Server.Application.DTOs.Dashboard
{
    public class PagedResultDTO<T>
    {
        public int Page { get; set; }

        public int PageSize { get; set; }

        public int TotalRecords { get; set; }

        public int TotalPages { get; set; }

        public List<T> Data { get; set; } = new List<T>();
    }
}

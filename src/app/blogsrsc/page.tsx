import Link from "next/link";
export default async function BlogRsc(){
    
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const blogs = await response.json()
    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Titulo</th>
                        <th>Contenido</th>
                    </tr>    
                </thead>
                <tbody>
                    {blogs.map((blog: any) => (
                        <tr key={blog.id}>
                            <td>
                                <Link href={`/blogsrsc/${blog.id}`}>{blog.id}</Link>
                            </td>
                            <td>{blog.title}</td>
                            <td>{blog.body}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
 
        </div>
    )
}
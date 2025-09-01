export default async function BlogRsc({params}:any){
    const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${params.idBlog}`);
    const blog = await response.json()
    return (
        <div>
            <h1>Blog</h1>
            <h2>{blog.id} Titulo: {blog.title}</h2>
            <p>Cuerpo: {blog.body}</p>
        </div>
    )
}
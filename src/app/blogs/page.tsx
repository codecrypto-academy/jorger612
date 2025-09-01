"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

let c = 0;
export default function Blogs(){
    const [blogs, setBlogs] = useState([]);
    console.log("c", c++);
    useEffect(() => {
        fetch("https://jsonplaceholder.typicode.com/posts")
        .then(response => response.json())
        .then(data => setBlogs(data));
    }, []);

    if(!blogs.length){
        return <div>Cargando...</div>
    }

    return (
        <div>
            <h1>Lista de blogs</h1>
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
"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Blog(){
    const [blog, setBog] = useState<any>(null);
    const params = useParams();
    useEffect(() => {
            fetch(`https://jsonplaceholder.typicode.com/posts/${params.idBlog}`)
            .then(response => response.json())
            .then(data => setBog(data));
    }, []);
    
    if(blog == null){
        return <div>Cargando...</div>
    }
    return (
        <div>
            <h1>Blog</h1>
            <h2>Titulo: {blog.title}</h2>
            <p>Cuerpo: {blog.body}</p>
        </div>
    )
}